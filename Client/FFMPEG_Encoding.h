#pragma once
#define _CRT_SECURE_NO_WARNINGS

#include <iostream>
#include <cstring>
#include <memory>
#include <string>
#include <cstdlib>
#include <cassert>
#include <ctime>
#include <WinSock2.h>
#include <WS2tcpip.h>
#include <Windows.h>
#include <map>

#pragma comment (lib, "Ws2_32.lib")
#pragma comment (lib, "Mswsock.lib")
#pragma comment (lib, "AdvApi32.lib")

#define DEVICES_MAX_NUM 10
#define DEVICES_NAME_FRENDLY 51
#define DEVICES_NAME_ALTERNATIVE 101
#define COMMAND_MAX_LEN 1024
#define BASE_COMMAND_LEN 512

using namespace std;

enum class DeviceCategory {
	VIDEO,
	AUDIO
};

char* stoa(unsigned short port);

DeviceCategory parseDeviceCategory(char* src);

void getDevices();

void parseDeviceName(char* dest, char* src);

string generateFFMPEG_Command(string hostIP, short port, char* videoSrc, char* audioSrc, char* resolution);

map<string, string> parseParam(string query, char delimeter1, char delimeter2);

unsigned short httpRequest(string hostIP, string method, map<string, string> parameters, bool hasReturn);

unsigned short connectServer(string hostIP, string userID);
void disconnectServer(string hostIP, short port);