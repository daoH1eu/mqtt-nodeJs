#ifndef SENSOR_H
#define SENSOR_H
#include <Arduino.h>
#include <DHT.h>

class Sensor
{
private:
    float voMeasured{};
    float calcVoltage{};
    float dustDensity{};
    //cam bien bui
    int measurePin{};//analog pin
    int ledPower{};//digital pin
    int samplingTime{};
    int deltaTime{};
    int sleepTime{};
    //cam bien
    int mq135Pin{};//analog pin
    int mq7Pin{};//analog pin
    int luxPin{};//analog pin
    int soilPin{};//analog pin
    uint8_t dht11Pin{};//digital pin
    DHT dht;
public:
    Sensor(int measurePin, int ledPower, int mq135Pin, int mq7Pin, uint8_t dht11Pin, int luxPin, int soilPin);
    void begin();
    float getDustDensity();
    long getTemperature();
    long getHumidity();
    float getLux();
    float getCo2();
    float getCo();
    long getSoilPercent();
};
#endif