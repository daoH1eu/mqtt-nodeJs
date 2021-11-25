#include <Arduino.h>
#include <PubSubClient.h>
#include <WiFiManager.h>

// MQTT Broker
const char *mqtt_broker = "broker.emqx.io";
const int mqtt_port = 1883;

unsigned long lastConnect = 0;

WiFiClient espClient;
PubSubClient client(espClient);
String my_id;

//ham callback dc goi khi co message tu topic subcribed
void callback(char *topic, byte *payload, unsigned int length);
//6s ktra ket noi va publish trang thai cam bien 1 lan
void checkConnect();

#define greendLed 0
#define redLed 2

void setup()
{
  Serial.begin(115200);
  while (!Serial)
  {
  }

  pinMode(greendLed, OUTPUT);
  pinMode(redLed, OUTPUT);
  digitalWrite(greendLed, HIGH);
  digitalWrite(redLed, LOW);

  WiFiManager wm;
  WiFi.mode(WIFI_STA);
  bool res = wm.autoConnect("ESP01s", "12345678");
  if (!res)
  {
    ESP.reset();
  }
  my_id = WiFi.localIP().toString() + "-esp8266-id";

  client.setServer(mqtt_broker, mqtt_port);
  client.setCallback(callback); //callback function
  while (!client.connected())   // Chờ tới khi kết nối
  {
    //Setting a QOS of 1 for the last will message attempts to makes sure the subscribers see it, last will message
    if (client.connect(my_id.c_str(), "sensor/state", 1, false, "0")) //neu mat ket noi voi mqtt, se gui msg "0"
      break;
    delay(200);
  }

  client.subscribe("home/device"); //4s server gui du lieu 1 lan

  client.publish("sensor/state", "1"); //i'm online

  digitalWrite(greendLed, LOW);
  digitalWrite(redLed, HIGH);
}

void loop()
{
  client.loop();
  checkConnect();
  //receive data from Uno
  if (Serial.available() > 0)
  {
    String data_str = Serial.readString();
    const char *data = data_str.c_str();
    client.publish("home/sensor", data);
  }
}

void callback(char *topic, byte *payload, unsigned int length)
{
  char message[length + 1];
  strncpy(message, (char *)payload, sizeof(message));
  message[length] = '\0'; //array payload k co ky tu null o cuoi

  //send data to Uno
  if (strcmp(topic, "home/device") == 0)
  {
    Serial.print("D");
    Serial.print(message);
  }
}

void checkConnect()
{
  if (millis() - lastConnect > 6000)
  {
    lastConnect = millis();
    if (!WiFi.isConnected())
    {
      digitalWrite(greendLed, HIGH);
      digitalWrite(redLed, LOW);
    }
    else
    {
      digitalWrite(greendLed, LOW);
      digitalWrite(redLed, HIGH);
    }
    if (!client.connected())
    {
      if (client.connect(my_id.c_str(), "sensor/state", 1, false, "0"))
      {
        client.subscribe("home/device");
      }
    }
    else
      client.publish("sensor/state", "1");
  }
}