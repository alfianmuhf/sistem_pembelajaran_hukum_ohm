#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <INA226.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// =====================================================
// WIFI & MQTT KONFIGURASI
// =====================================================
const char* ssid = "X1";
const char* password = "89898989";

const char* mqtt_server = "56986984f5814ef7b08f5ea28d208c41.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "sys.ohm.law";
const char* mqtt_pass = "System.Ohm.Laws--00";

const char* topic_data = "ohm/sensor/data";
const char* topic_status = "ohm/sensor/status";
const char* topic_control = "ohm/control/resistor";

WiFiClientSecure espClient;
PubSubClient client(espClient);

// =====================================================
// PIN SENSOR
// =====================================================
#define DS18B20_PIN 4
#define VOLTAGE_PIN 5

#define SDA_PIN 8
#define SCL_PIN 9

// =====================================================
// TRANSISTOR RESISTOR
// =====================================================
const int transistorPins[4] = {
  18,   // 220 ohm
  17,   // 330 ohm
  16,   // 470 ohm
  15    // 680 ohm
};

// =====================================================
// LED INDIKATOR
// =====================================================
const int ledPins[4] = {
  13,   // 220 ohm
  12,   // 330 ohm
  11,   // 470 ohm
  10    // 680 ohm
};

// =====================================================
// NILAI RESISTOR
// =====================================================
const float resistorValue[4] = {
  220.0,
  330.0,
  470.0,
  680.0
};

// resistor aktif default
int resistorAktif = 0;

// =====================================================
// DS18B20 & INA226
// =====================================================
OneWire oneWire(DS18B20_PIN);
DallasTemperature sensors(&oneWire);

INA226 INA(0x40);
const float SHUNT_RESISTOR = 0.1;

// =====================================================
// SENSOR TEGANGAN
// =====================================================
const float ADC_REF = 3.3;
const int ADC_MAX = 4095;

const float VOLTAGE_FACTOR = 5.0;
const float CALIBRATION_FACTOR = 1.067;

// Waktu untuk interval publish MQTT
unsigned long lastMsg = 0;

// =====================================================
// AKTIFKAN RESISTOR
// =====================================================
void pilihResistor(int index)
{
  if (index < 0 || index > 3) return;

  resistorAktif = index;

  for (int i = 0; i < 4; i++)
  {
    digitalWrite(transistorPins[i], LOW);
    digitalWrite(ledPins[i], LOW);
  }

  digitalWrite(transistorPins[index], HIGH);
  digitalWrite(ledPins[index], HIGH);

  Serial.println();
  Serial.print("Resistor aktif: ");
  Serial.print(resistorValue[index]);
  Serial.println(" ohm");
}

void matikanResistor()
{
  resistorAktif = -1;
  for (int i = 0; i < 4; i++)
  {
    digitalWrite(transistorPins[i], LOW);
    digitalWrite(ledPins[i], LOW);
  }
  Serial.println();
  Serial.println("Semua resistor dimatikan (Standby)");
}

void setupWifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  
  String msg = "";
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  Serial.println(msg);

  if (String(topic) == topic_control) {
    if (msg == "220") pilihResistor(0);
    else if (msg == "330") pilihResistor(1);
    else if (msg == "470") pilihResistor(2);
    else if (msg == "680") pilihResistor(3);
    else if (msg == "0" || msg == "stop") matikanResistor();
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Gunakan Client ID statis agar koneksi lama langsung ditendang dan mencegah Ghost LWT
    String clientId = "ESP32-Ohm-Law-Device";
    
    // Connect with LWT (Last Will and Testament)
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass, topic_status, 1, true, "offline")) {
      Serial.println("connected");
      // Publish online status
      client.publish(topic_status, "online", true);
      // Resubscribe
      client.subscribe(topic_control);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

// =====================================================
// BACA TEGANGAN
// =====================================================
float bacaTegangan()
{
  long total = 0;

  for (int i = 0; i < 100; i++)
  {
    total += analogRead(VOLTAGE_PIN);
    delay(2);
  }

  float adcRaw = total / 100.0;
  float adcVoltage = (adcRaw * ADC_REF) / ADC_MAX;
  float inputVoltage = adcVoltage * VOLTAGE_FACTOR * CALIBRATION_FACTOR;

  return inputVoltage;
}

// =====================================================
// BACA ARUS
// =====================================================
float bacaArus_mA()
{
  float shunt_mV = INA.getShuntVoltage_mV();
  return shunt_mV / SHUNT_RESISTOR;
}

// =====================================================
// BACA SUHU
// =====================================================
float bacaSuhu()
{
  sensors.requestTemperatures();
  return sensors.getTempCByIndex(0);
}

// =====================================================
// SETUP
// =====================================================
void setup()
{
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("================================");
  Serial.println("Sistem Praktikum Hukum Ohm + IoT");
  Serial.println("================================");

  // Setup WiFi and MQTT Secure Client
  setupWifi();
  espClient.setInsecure(); // Disable SSL certificate verification for simplicity
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  // transistor + led
  for (int i = 0; i < 4; i++)
  {
    pinMode(transistorPins[i], OUTPUT);
    pinMode(ledPins[i], OUTPUT);

    digitalWrite(transistorPins[i], LOW);
    digitalWrite(ledPins[i], LOW);
  }

  // resistor default = dimatikan (standby) menunggu perintah dari web
  matikanResistor();

  // ADC
  analogReadResolution(12);
  analogSetPinAttenuation(VOLTAGE_PIN, ADC_11db);

  // DS18B20
  sensors.begin();
  sensors.setWaitForConversion(false); // Non-blocking temperature read

  // I2C
  Wire.begin(SDA_PIN, SCL_PIN);

  if (!INA.begin())
  {
    Serial.println("INA226 gagal terdeteksi!");
    while (1);
  }

  Serial.println("INA226 OK");
}

// =====================================================
// LOOP
// =====================================================
void loop()
{
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Publish data every 1000 ms
  unsigned long now = millis();
  if (now - lastMsg > 1000) {
    lastMsg = now;

    float suhu = bacaSuhu();
    float tegangan = bacaTegangan();
    float arus_mA = bacaArus_mA();
    float resistor = resistorAktif >= 0 ? resistorValue[resistorAktif] : 0.0;

    // Format JSON String manually
    char payload[150];
    sprintf(payload, "{\"suhu\": %.2f, \"tegangan\": %.3f, \"arus\": %.3f, \"resistor\": %.1f}", suhu, tegangan, arus_mA, resistor);
    
    // Publish
    client.publish(topic_data, payload);

    // Optional: Print to Serial for debugging
    Serial.print("Publish message: ");
    Serial.println(payload);
  }
}