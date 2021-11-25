#include <Arduino.h>
#include <Adafruit_Sensor.h>
#include "Sensor.h"
#include <ArduinoJson.h>

//analog pin
#define mq7Pin 0
#define mq135Pin 1
#define luxPin 2
#define measurePin 3
#define soilPin 4
//digital pin
#define dht11Pin 13
#define ledPower 12

int device_pin[] = {2, 3, 4, 5, 6, 7, 8, 9, 10, 11};
int length = sizeof(device_pin) / sizeof(device_pin[0]);
unsigned long timer1 = 0;
int device_livingroom[4] = {0}, device_kitchen[4] = {0}, device_bed1[4] = {0}, device_bed2[4] = {0};

Sensor mySensor(measurePin, ledPower, mq135Pin, mq7Pin, dht11Pin, luxPin, soilPin);

//tach chuoi Json
void parseJson(const char *data, const char delimiter);
void control();

void setup()
{
    Serial.begin(115200);
    while (!Serial)
    {
    }
    for (int i = 0; i < length; i++)
    {
        pinMode(device_pin[i], OUTPUT);
        digitalWrite(device_pin[i], LOW);
    }
    mySensor.begin();
}

void loop()
{
    if (Serial.available() > 0)
    {
        //receive data from Esp
        String data_str = Serial.readString();
        const char *data = data_str.c_str(); //co chua 1 ky tu danh dau dau tien trong chuoi

        //data[0] = delimiter
        switch (data[0])
        {
        case 'D':
            parseJson(data, data[0]);
            break;
        default:
            break;
        }
    }

    if (millis() - timer1 > 15000)
    {
        timer1 = millis();
        int dust = mySensor.getDustDensity();
        int lux = mySensor.getLux();
        int co2 = mySensor.getCo2();
        int co = mySensor.getCo();
        int soil = mySensor.getSoilPercent();
        int temperature = mySensor.getTemperature();
        int humidity = mySensor.getHumidity();

        char msg[130];
        sprintf(msg, "{\"Temper\":%d, \"Humi\":%d, \"Co2\":%d, \"Gas\":%d, \"Lux\":%d, \"Dust\":%d, \"Vibrant\":%d}", temperature, humidity, co2, co, lux, dust, soil);
        //Uno send data to Esp
        Serial.print(msg);
    }

    control();
}

void parseJson(const char *data, const char delimiter)
{
    unsigned int _length = strlen(data);
    char json[_length];
    strncpy(json, data + 1, _length - 1);
    json[_length - 1] = '\0';

    // Serial_2.println(json);

    if (delimiter == 'D') //device
    {
        const size_t capacity = 4 * JSON_ARRAY_SIZE(4) + JSON_OBJECT_SIZE(4) + 70;
        DynamicJsonBuffer jsonBuffer(capacity);

        JsonObject &root = jsonBuffer.parseObject(json);

        JsonArray &kitchen = root["kitchen"];
        device_kitchen[0] = kitchen[0];
        device_kitchen[1] = kitchen[1];
        device_kitchen[2] = kitchen[2];
        device_kitchen[3] = kitchen[3];

        JsonArray &living = root["living"];
        device_livingroom[0] = living[0];
        device_livingroom[1] = living[1];
        device_livingroom[2] = living[2];
        device_livingroom[3] = living[3];

        JsonArray &bed1 = root["bed1"];
        device_bed1[0] = bed1[0];
        device_bed1[1] = bed1[1];
        device_bed1[2] = bed1[2];
        device_bed1[3] = bed1[3];

        JsonArray &bed2 = root["bed2"];
        device_bed2[0] = bed2[0];
        device_bed2[1] = bed2[1];
        device_bed2[2] = bed2[2];
        device_bed2[3] = bed2[3];
    }
}

void control()
{
    //livingroom
    if (device_livingroom[0] == 1)
        digitalWrite(device_pin[9], HIGH);//11
    else
        digitalWrite(device_pin[9], LOW);

    if (device_livingroom[1] == 1)
        digitalWrite(device_pin[8], HIGH);//10
    else
        digitalWrite(device_pin[8], LOW);

    if (device_livingroom[2] == 1)
        digitalWrite(device_pin[7], HIGH);//9
    else
        digitalWrite(device_pin[7], LOW);

    if (device_livingroom[3] == 1)
        digitalWrite(device_pin[6], HIGH);//8
    else
        digitalWrite(device_pin[6], LOW);
    //kitchen
    if (device_kitchen[0] == 1)
        digitalWrite(device_pin[5], HIGH);//7
    else
        digitalWrite(device_pin[5], LOW);

    if (device_kitchen[1] == 1)
        digitalWrite(device_pin[4], HIGH);//6
    else
        digitalWrite(device_pin[4], LOW);
    //bed1
    if (device_bed1[0] == 1)
        digitalWrite(device_pin[3], HIGH);//5
    else
        digitalWrite(device_pin[3], LOW);

    if (device_bed1[1] == 1)
        digitalWrite(device_pin[2], HIGH);//4
    else
        digitalWrite(device_pin[2], LOW);
    //bed2
    if (device_bed2[0] == 1)
        digitalWrite(device_pin[1], HIGH);//3
    else
        digitalWrite(device_pin[1], LOW);

    if (device_bed2[1] == 1)
        digitalWrite(device_pin[0], HIGH);//2
    else
        digitalWrite(device_pin[0], LOW);
}