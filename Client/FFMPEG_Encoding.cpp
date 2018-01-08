#include "FFMPEG_Encoding.h"


string server_host = "164.125.121.125";

char devices_friendlyName[2][DEVICES_MAX_NUM][DEVICES_NAME_FRENDLY];
char devices_alternativeName[2][DEVICES_MAX_NUM][DEVICES_NAME_ALTERNATIVE];
int videoDeviceNum = 0, audioDeviceNum = 0;

char* stoa(unsigned short num) {
	int digit = 0;
	for (int i = 1; num >= i; i *= 10) {
		digit++;
	}

	char* str = new char[digit + 1];
	str[digit] = 0;

	for (int i = digit - 1; i >= 0; i--) {
		str[i] = num % 10 + '0';
		num /= 10;
	}

	return str;
}

DeviceCategory parseDeviceCategory(char* src) {
	while (*src++ != ']')
		;
	src += 12;

	if (*src == 'v')
		return DeviceCategory::VIDEO;
	if (*src == 'a')
		return DeviceCategory::AUDIO;
}

void getDevices() {
	char dummy[1024];

	//List enable devices
	string deviceList("ffmpeg -list_devices true -f dshow -i dummy 2>&1");

	FILE* deviceList_command = _popen(deviceList.c_str(), "r");

	if (!deviceList_command) throw runtime_error("popen() failed!");
	while (fgets(dummy, 1024, deviceList_command) != 0) {
		if (dummy[0] != '[')
			continue;

		DeviceCategory category = parseDeviceCategory(dummy);

		fgets(dummy, 1024, deviceList_command);

		switch (category) {
		case DeviceCategory::VIDEO:
			//Friendly Name
			parseDeviceName(devices_friendlyName[0][videoDeviceNum], dummy);

			//Alternative Name
			fgets(dummy, 1024, deviceList_command);

			parseDeviceName(devices_alternativeName[0][videoDeviceNum], dummy);
			//cout << "[" << deviceNum << "]" << devices[0][deviceNum] << " - Video Device" << endl;

			videoDeviceNum++;
			break;
		case DeviceCategory::AUDIO:
			//Friendly Name
			parseDeviceName(devices_friendlyName[1][audioDeviceNum], dummy);

			//Alternative Name
			fgets(dummy, 1024, deviceList_command);

			parseDeviceName(devices_alternativeName[1][audioDeviceNum], dummy);
			//cout << "[" << deviceNum << "]" << devices[1][deviceNum] << " - Audio Device" << endl;

			audioDeviceNum++;
			break;
		}
	}
}

void parseDeviceName(char* dest, char* src) {
	while (*src++ != '\"')
		;

	int i;
	for (i = 0; *(src + i) != '\"'; i++)
		;

	memcpy(dest, src, i);
}

string generateFFMPEG_Command(string hostIP, short port, char* videoSrc, char* audioSrc, char* resolution) {
	//int len = BASE_COMMAND_LEN + strlen(videoSrc) + strlen(audioSrc) + strlen(resolution);

	//char* FFMPEG_command = new char[len];

	string FFMPEG_command = "ffmpeg -y -rtbufsize 512M -s " + string(resolution) +
		" -f dshow -i video=\"" + string(videoSrc) +
		"\":audio=\"" + string(audioSrc) +
		"\" -vcodec libx264 -preset ultrafast -tune zerolatency -async 1" +
		" -acodec aac -ab 24k -ar 8000 -maxrate 750k -bufsize 3000k -f mpegts udp://" + hostIP + ":" + stoa(port);

	return FFMPEG_command;
}

#define DEFAULT_BUFLEN 512

unsigned short httpRequest(string hostIP, string method, map<string, string> parameters, bool hasReturn) {
	WSADATA wsaData;
	SOCKET ConnectSocket = INVALID_SOCKET;
	struct addrinfo * result = NULL, *ptr = NULL, hints;
	string sendbuf = "GET http://" + hostIP + ":15000/" + method + "?";

	map<string, string>::iterator iter = parameters.begin();

	while(true) {
		sendbuf += iter->first + "=" + iter->second;
		iter++;

		if (iter != parameters.end())
			sendbuf += "&";
		else
			break;
	}

	sendbuf += " HTTP/1.0\r\n\r\n";

	cout << sendbuf << endl;
	char recvbuf[DEFAULT_BUFLEN];
	int iResult;
	int recvbuflen = DEFAULT_BUFLEN;

	iResult = WSAStartup(MAKEWORD(2, 2), &wsaData);
	if (iResult != 0) {
		printf("WSAStartup failed with error: %d\n", iResult);
		return -1;
	}

	ZeroMemory(&hints, sizeof(hints));
	hints.ai_family = AF_UNSPEC;
	hints.ai_socktype = SOCK_STREAM;
	hints.ai_protocol = IPPROTO_TCP;

	iResult = getaddrinfo(hostIP.data(), "15000", &hints, &result);

	if (iResult != 0)
	{
		printf("getaddrinfo failed with error: %d\n", iResult);
		WSACleanup();
		exit(1);
	}

	// Attempt to connect to an address until one succeeds
	for (ptr = result; ptr != NULL; ptr = ptr->ai_next) {

		// Create a SOCKET for connecting to server
		ConnectSocket = socket(ptr->ai_family, ptr->ai_socktype,
			ptr->ai_protocol);

		if (ConnectSocket == INVALID_SOCKET) {
			printf("socket failed with error: %ld\n", WSAGetLastError());
			WSACleanup();
			exit(1);
		}

		// Connect to server.
		iResult = connect(ConnectSocket, ptr->ai_addr, (int)ptr->ai_addrlen);

		if (iResult == SOCKET_ERROR)
		{
			closesocket(ConnectSocket);
			ConnectSocket = INVALID_SOCKET;
			printf("The server is down... did not connect");
		}
	}

	// no longer need address info for server
	freeaddrinfo(result);

	// if connection failed
	if (ConnectSocket == INVALID_SOCKET)
	{
		printf("Unable to connect to server!\n");
		WSACleanup();
		exit(1);
	}

	iResult = send(ConnectSocket, sendbuf.data(), (int)strlen(sendbuf.data()), 0);
	if (iResult == SOCKET_ERROR) {
		printf("send failed with error: %d\n", WSAGetLastError());
		closesocket(ConnectSocket);
		WSACleanup();
		return 1;
	}
	if (hasReturn) {
		iResult = recv(ConnectSocket, recvbuf, recvbuflen, 0);
		if (iResult > 0) {
			std::string str(recvbuf);
			int dataStart = str.find('{') + 1;
			int dataEnd = str.find('}');
			str = str.substr(dataStart, dataEnd - dataStart);
			map<string, string> params = parseParam(str, ',', ':');
			iResult = atoi(params.at("\"port\"").data());
		}
		else if (iResult == 0) {
			printf("Connection closed\n");
		}
		else {
			printf("recv failed with error: %d\n", WSAGetLastError());
		}
	}

	// cleanup
	closesocket(ConnectSocket);
	WSACleanup();

	return iResult;
}

map<string, string> parseParam(string query, char delimeter1, char delimeter2) {
	map<string, string> params;
	string part;
	
	while (true) {
		int idx = query.find(delimeter1);
		part = query.substr(0, idx);
		query = query.substr(idx + 1);

		int delim = part.find(delimeter2);

		params.insert(pair<string, string>(part.substr(0, delim), part.substr(delim + 1)));

		if (idx == -1)
			break;
	}

	return params;
}