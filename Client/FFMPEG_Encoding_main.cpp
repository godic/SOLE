#include "FFMPEG_Encoding.h"

extern char devices_friendlyName[2][DEVICES_MAX_NUM][DEVICES_NAME_FRENDLY];
extern char devices_alternativeName[2][DEVICES_MAX_NUM][DEVICES_NAME_ALTERNATIVE];
extern int videoDeviceNum, audioDeviceNum;

int main(int argc, char** argv) {

	//Check available Usage
	if (argc != 4) {
		cout << "Usage: %s <IP> <ID> <Quality: H(High) M(Medium) L(Low)>" << endl;
		return -1;
	}

	char resolution[10];

	switch (argv[3][0]) {
	case 'H':
		strcpy(resolution, "1280:720");
		break;
	case 'M':
		strcpy(resolution, "480:360");
		break;
	case 'L':
		strcpy(resolution, "176:144");
		break;
	}	

	getDevices();

	int selectedVideoDevice, selectedAudioDevice;

	if(videoDeviceNum > 0) {
		for (int i = 0; i < videoDeviceNum; i++) {
			cout << "[" << i << "]" << devices_friendlyName[0][i] << " - Video Device" << endl;
		}

		cout << "Select Video Device Number" << endl;

		do {
			cin >> selectedVideoDevice;
		} while (selectedVideoDevice >= videoDeviceNum || selectedVideoDevice < 0);
	}
	else {
		selectedVideoDevice = -1;
		cout << "There's no video input device" << endl;
		return 1;
	}

	if (audioDeviceNum > 0) {
		for (int i = 0; i < audioDeviceNum; i++) {
			cout << "[" << i << "]" << devices_friendlyName[1][i] << " - Audio Device" << endl;
		}

		cout << "Select Audio Device Number" << endl;

		do {
			cin >> selectedAudioDevice;
		} while (selectedVideoDevice >= videoDeviceNum || selectedVideoDevice < 0);
	}
	else {
		selectedAudioDevice = -1;
		cout << "There's no audio input device" << endl;
		return 1;
	}
	string hostIP = string(argv[1]);
	map<string, string> query = parseParam("userID=" + string(argv[2]), '&', '=');
	unsigned short port = httpRequest(hostIP, "connectServer", query, true);

	string FFMPEG_command = generateFFMPEG_Command(hostIP, port, devices_alternativeName[0][selectedVideoDevice], devices_alternativeName[1][selectedAudioDevice], resolution);

	//Command String Generation
	system(FFMPEG_command.c_str());

	char portStr[10];
	_itoa(port, portStr, 10);

	query = parseParam("port=" + string(portStr), '&', '=');

	httpRequest(hostIP, "disconnectServer", query ,false);

	return 0;
}