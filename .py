import time
import machine
blueled = machine.Pin(2, machine.Pin.OUT)

# Blink 10 times
for i in range(1,11):
    blueled.value(0)
    time.sleep(0.5)
    blueled.value(1)
    time.sleep(0.5)

print("DONE!")