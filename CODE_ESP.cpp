#include <Wire.h>
#include <INA226.h>
#include <OneWire.h>
#include <DallasTemperature.h>

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
// DS18B20
// =====================================================
OneWire oneWire(DS18B20_PIN);
DallasTemperature sensors(&oneWire);

// =====================================================
// INA226
// =====================================================
INA226 INA(0x40);

const float SHUNT_RESISTOR = 0.1;

// =====================================================
// SENSOR TEGANGAN
// =====================================================
const float ADC_REF = 3.3;
const int ADC_MAX = 4095;

const float VOLTAGE_FACTOR = 5.0;

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

// =====================================================
// CEK SERIAL
// =====================================================
void cekSerial()
{
  if (Serial.available())
  {
    char c = Serial.read();

    switch (c)
    {
      case '1':
        pilihResistor(0);
        break;

      case '2':
        pilihResistor(1);
        break;

      case '3':
        pilihResistor(2);
        break;

      case '4':
        pilihResistor(3);
        break;
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

  float adcVoltage =
      (adcRaw * ADC_REF) / ADC_MAX;

  float inputVoltage =
      adcVoltage * VOLTAGE_FACTOR;

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
  Serial.println("Sistem Praktikum Hukum Ohm");
  Serial.println("================================");

  // transistor + led
  for (int i = 0; i < 4; i++)
  {
    pinMode(transistorPins[i], OUTPUT);
    pinMode(ledPins[i], OUTPUT);

    digitalWrite(transistorPins[i], LOW);
    digitalWrite(ledPins[i], LOW);
  }

  // resistor default = 220 ohm
  pilihResistor(0);

  // ADC
  analogReadResolution(12);
  analogSetPinAttenuation(VOLTAGE_PIN, ADC_11db);

  // DS18B20
  sensors.begin();

  // I2C
  Wire.begin(SDA_PIN, SCL_PIN);

  if (!INA.begin())
  {
    Serial.println("INA226 gagal terdeteksi!");
    while (1);
  }

  Serial.println("INA226 OK");

  Serial.println();
  Serial.println("Ketik:");
  Serial.println("1 = 220 ohm");
  Serial.println("2 = 330 ohm");
  Serial.println("3 = 470 ohm");
  Serial.println("4 = 680 ohm");
  Serial.println();
}

// =====================================================
// LOOP
// =====================================================
void loop()
{
  cekSerial();

  float suhu = bacaSuhu();
  float tegangan = bacaTegangan();

  float shunt_mV = INA.getShuntVoltage_mV();
  float arus_mA = bacaArus_mA();

  float resistor = resistorValue[resistorAktif];

  float arusTeori_mA =
      (tegangan / resistor) * 1000.0;

  Serial.println("================================");

  Serial.print("Resistor  : ");
  Serial.print(resistor);
  Serial.println(" ohm");

  Serial.print("Suhu      : ");
  Serial.print(suhu, 2);
  Serial.println(" C");

  Serial.print("Tegangan  : ");
  Serial.print(tegangan, 3);
  Serial.println(" V");

  Serial.print("Shunt     : ");
  Serial.print(shunt_mV, 3);
  Serial.println(" mV");

  Serial.print("Arus INA  : ");
  Serial.print(arus_mA, 3);
  Serial.println(" mA");

  Serial.print("Arus Teori: ");
  Serial.print(arusTeori_mA, 3);
  Serial.println(" mA");

  Serial.println();
  delay(1000);
}
