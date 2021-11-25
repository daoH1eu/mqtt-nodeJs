#include "Sensor.h"

Sensor::Sensor(int measurePin, int ledPower, int mq135Pin, int mq7Pin, uint8_t dht11Pin, int luxPin, int soilPin)
    : measurePin{measurePin}, ledPower{ledPower}, samplingTime{280}, deltaTime{40}, sleepTime{9680},
      mq135Pin{mq135Pin}, luxPin{luxPin}, soilPin{soilPin}, dht11Pin{dht11Pin}, dht{dht11Pin, DHT11}
{
}

void Sensor::begin()
{
    dht.begin();
    pinMode(ledPower, OUTPUT);
}

float Sensor::getDustDensity()
{
    //doc cam bien bui
    digitalWrite(ledPower, LOW);         // Bật IR LED
    delayMicroseconds(samplingTime);     //Delay 0.28ms
    voMeasured = analogRead(measurePin); // Đọc giá trị ADC V0
    delayMicroseconds(deltaTime);        //Delay 0.04ms
    digitalWrite(ledPower, HIGH);        // Tắt LED
    delayMicroseconds(sleepTime);        //Delay 9.68ms
    // Tính điện áp từ giá trị ADC
    calcVoltage = voMeasured * (5.0 / 1024); //Điệp áp Vcc của cảm biến (5.0 hoặc 3.3)
    /*Dust Density = 0.17xvoltage-0.1 // mg/m3
    to convert to ug/m3 the equation becomes:
    Dust Density = (0.17xvoltage-0.1)*1000 // ug/m3*/
    dustDensity = (0.17 * calcVoltage - 0.1) * 1000; // ug/m3

    return dustDensity;
}

long Sensor::getTemperature()
{

    return dht.readTemperature();
}

long Sensor::getHumidity()
{
    return dht.readHumidity();
}

float Sensor::getLux()
{
    float volts = (analogRead(luxPin) * 5.0) / 1024.0;
    float amps = volts / 10000.0; // across 10,000 Ohms
    float microamps = amps * 1000000;
    return microamps * 2.0;//lux
}

float Sensor::getCo2()
{
    int value = analogRead(mq135Pin);
    float res = ((1024. / (float)value) * 5. - 1.) * 10.;

    return 116.6020682f * pow((res / 754.53f), -2.769034857f);
}

/*
The coefficients are estimated from the sensitivity characteristics graph
of the MQ7 sensor for CO (Carbon Monoxide) gas by using Correlation function.
Explanation :
	The graph in the datasheet is represented with the function
	f(x) = a * (x ^ b).
	where
		f(x) = ppm
		x = Rs/R0
	The values were mapped with this function to determine the coefficients a and b.
*/
float Sensor::getCo()
{
    int value = analogRead(mq7Pin);
    float v_out = value * (5.0f / 1024.0f);
    float RvRo = (5.0f - v_out) / v_out;

    return (19.32f * pow(RvRo, -0.64f)); //return ppm
}

long Sensor::getSoilPercent()
{
    int sum_adc = 0, adc_tb = 0;
    for (int i = 0; i < 10; i++)
    {
        int value_adc = analogRead(soilPin);
        int sum_adc = sum_adc + value_adc;
    }
    adc_tb = sum_adc / 10;
    return map(adc_tb, 1023, 0, 0, 100); // quy đổi tỉ lệ điện áp thành % độ ẩm đất
}