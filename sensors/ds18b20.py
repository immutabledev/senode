from w1thermsensor import W1ThermSensor

sensor1 = W1ThermSensor(W1ThermSensor.THERM_SENSOR_DS18B20, "00042b31f0ff")

sensor2 = W1ThermSensor(W1ThermSensor.THERM_SENSOR_DS18B20, "00042e0895ff")

temp1 = sensor1.get_temperature(W1ThermSensor.DEGREES_F)
print("Temp 1: [",temp1,"]\n")

temp2 = sensor2.get_temperature(W1ThermSensor.DEGREES_F)
print("Temp 2: [",temp2,"]\n")
