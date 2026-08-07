#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "HX711.h"

// ===================== WIFI / SERVER =====================
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_HOST = "localhost";
const uint16_t SERVER_PORT = 8081;
const char* VEHICLE_NUMBER = "UPABC1234";  // must match registered vehicle on website

// ===================== PINS =====================
#define DT_PIN D5
#define SCK_PIN D6
#define BUZZER_PIN D8
#define RELAY_PIN D7
#define BUTTON_PIN D3

#define WEIGHT_LIMIT 0.500   // overload limit in kg

// ===================== GLOBALS =====================
HX711 scale;
LiquidCrystal_I2C lcd(0x27, 16, 2);
bool wasOverloaded = false;
bool wifiReady = false;

// ===================== WIFI =====================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    wifiReady = true;
    return;
  }

  wifiReady = false;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");

  for (int i = 0; i < 30 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500);
    lcd.print(".");
  }

  wifiReady = (WiFi.status() == WL_CONNECTED);
  lcd.setCursor(0, 0);
  lcd.print(wifiReady ? "WiFi Connected  " : "WiFi Failed      ");
  delay(800);
}

// ===================== API =====================
bool sendStrikeToServer() {
  if (!wifiReady) {
    Serial.println("WiFi not connected - strike not sent");
    return false;
  }

  WiFiClient client;
  HTTPClient http;
  String url = String("http://") + SERVER_HOST + ":" + SERVER_PORT +
               "/violation/increase?vehicleNumber=" + VEHICLE_NUMBER;

  http.begin(client, url);
  int httpCode = http.GET();
  String response = http.getString();
  http.end();

  Serial.print("Strike API HTTP ");
  Serial.print(httpCode);
  Serial.print(" -> ");
  Serial.println(response);

  return httpCode == 200;
}

// ===================== SETUP =====================
void setup() {
  Serial.begin(9600);

  scale.begin(DT_PIN, SCK_PIN);
  scale.set_scale(-440500);
  scale.tare();

  lcd.init();
  lcd.backlight();

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(RELAY_PIN, LOW);

  connectWiFi();

  lcd.setCursor(0, 0);
  lcd.print("Vehicle Ready...");
  delay(1000);
}

// ===================== LOOP =====================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    wifiReady = false;
    connectWiFi();
  }

  float weight = scale.get_units(5);
  bool buttonPressed = (digitalRead(BUTTON_PIN) == LOW);
  bool isOverloaded = weight > WEIGHT_LIMIT;

  lcd.setCursor(0, 0);
  lcd.print("Weight: ");
  lcd.print(weight, 3);
  lcd.print("kg   ");

  if (isOverloaded) {
    digitalWrite(RELAY_PIN, LOW);
    digitalWrite(BUZZER_PIN, HIGH);

    lcd.setCursor(0, 1);
    lcd.print("OVERLOAD!!!    ");

    // Send strike once per overload event (not every 200 ms)
    if (!wasOverloaded) {
      Serial.println("OVERLOAD DETECTED -> sending strike");
      if (sendStrikeToServer()) {
        Serial.println("Strike sent to website");
      } else {
        Serial.println("Failed to send strike");
      }
    } else {
      Serial.println("OVERLOAD DETECTED -> Motor Locked");
    }
  } else {
    digitalWrite(BUZZER_PIN, LOW);

    if (buttonPressed) {
      digitalWrite(RELAY_PIN, HIGH);
      lcd.setCursor(0, 1);
      lcd.print("Motor: ON       ");
      Serial.println("Button ON -> Motor ON");
    } else {
      digitalWrite(RELAY_PIN, LOW);
      lcd.setCursor(0, 1);
      lcd.print("Motor: OFF      ");
      Serial.println("Button OFF -> Motor OFF");
    }
  }

  wasOverloaded = isOverloaded;
  delay(200);
}
