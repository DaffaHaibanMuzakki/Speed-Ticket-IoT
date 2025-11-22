#define trig1 D5
#define echo1 D6
#define trig2 D7
#define echo2 D8
#define buzzer D2

float distanceBetween = 0.30; // meter (30 cm)
float speedLimit = 10.0;      // km/jam (ubah sesuai kebutuhan)


float measureUltrasonic(int trig, int echo) {
  long duration;
  float distance;

  digitalWrite(trig, LOW);
  delayMicroseconds(2);

  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);

  duration = pulseIn(echo, HIGH);
  distance = (duration * 0.0343) / 2.0; // cm
  return distance;
}

void setup() {
  Serial.begin(115200);

  pinMode(trig1, OUTPUT);
  pinMode(echo1, INPUT);

  pinMode(trig2, OUTPUT);
  pinMode(echo2, INPUT);

  pinMode(buzzer, OUTPUT);

  Serial.println("Speed Ticket System Ready");
}

void loop() {
  float d1 = measureUltrasonic(trig1, echo1);
  if (d1 < 20) {  
    unsigned long tStart = millis();
    Serial.println("Sensor 1 triggered... waiting for sensor 2");

    while (true) {
      float d2 = measureUltrasonic(trig2, echo2);
      if (d2 < 20) {
        unsigned long tEnd = millis();
        float timeSec = (tEnd - tStart) / 1000.0;

        // ---- Hitung kecepatan ----
        float speed_mps = distanceBetween / timeSec;    // m/s
        float speed_kmph = speed_mps * 3.6;             // km/jam

        Serial.print("Waktu: ");
        Serial.print(timeSec);
        Serial.println(" s");

        Serial.print("Kecepatan: ");
        Serial.print(speed_kmph);
        Serial.println(" km/jam");

        // ---- Cek apakah melewati speed limit ----
        if (speed_kmph > speedLimit) {
          Serial.println("⚠️ *KECEPATAN TERLALU TINGGI!* DENDA DIKELUARKAN!");

          // Tone buzzer (frekuensi 2000 Hz, durasi 800 ms)
          tone(buzzer, 2000, 800);
          delay(800);
        } else {
          Serial.println("Kecepatan normal.");
        }

        delay(1000);
        break;
      }
    }
  }
}