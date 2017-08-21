#!/usr/bin/env python
# -*- coding: utf-8 -*-
# PYTHON_ARGCOMPLETE_OK

import os
import time
import datetime
import threading
import zmq
from luma.core.render import canvas
from luma.oled.device import ssd1306
from luma.core.interface.serial import spi
from PIL import ImageFont

temp1 = "---" 
temp1_v = 0
temp2 = "---" 
temp2_v = 0
temp3 = "---"
temp3_v = 0
temp = "---"
temp_v = 0
humidity = "---"
humidity_v = 0
current1 = "---"
current1_v = 0
current2 = "---"
current2_v = 0

system_status = 0
heartbeat_ts = 0

def main():
    global heartbeat_ts

    serial = spi()
    device = ssd1306(serial)

    font_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'fonts', "ProggyTiny.ttf"))
    font = ImageFont.truetype(font_path, 16) 
    fontLarge = ImageFont.truetype(font_path, 30)

    today_last_time = "Unknown"
    heartbeat_ts = int(time.time())

    while True:
        now = datetime.datetime.now()
        today_date = now.strftime("%d %b %y")
        today_time = now.strftime("%H:%M:%S")
        if today_time != today_last_time:
            today_last_time = today_time
            with canvas(device) as draw:
                now = datetime.datetime.now()
                today_date = now.strftime("%b %d, %y")

                margin = 4

                cx = 30
                cy = min(device.height, 64) / 2

                left = cx - cy
                right = cx + cy

                draw.text((margin, 0), today_date, font=font, fill="white")
                draw.text((80, 0), today_time, font=font, fill="white")

		t1 = "---"
                t2 = "---"
                t3 = "---"
                t = "---"
                h = "---"
                c1 = "---"
                c2 = "---"

                # If time since last heartbeat is greater than 60 seconds
                ts = int(time.time())

		if (ts - heartbeat_ts) > 60:
		    draw.text((90, 56), "E:COMM", font=font, fill="white")
                else:
		    if temp1_v:
                        try:
                            t1 = "{:3d}".format(int(round(float(temp1))))
                        except:
		   
		    if temp2_v: 
                        try:
                            t2 = "{:3d}".format(int(round(float(temp2))))
                        except:
                   
                    if temp3_v:
                	try:
                    	    t3 = "{:3d}".format(int(round(float(temp3))))
                	except:

		    if temp_v:
                	try:
                    	    t = "{:3d}".format(int(round(float(temp))))
                	except:

		    if humdity_v:
                	try:
                    	    h = "{:3d}".format(int(round(float(humidity))))
                	except:

		    if current1_v:
                	try:
                    	    c1 = "{:03.1f}".format(float(current1))
                	except:

		    if current2_v:
                	try:
                    	    c2 = "{:03.1f}".format(float(current2))
                	except:

                draw.text((margin, 14), t1+"F", font=fontLarge, fill="white")
                draw.text((margin, 32), t2+"F", font=fontLarge, fill="white")
                draw.text((margin, 50), t3+"F", font=fontLarge, fill="white")

                draw.text((52, 24), c1+"A", font=font, fill="white")

                draw.text((52, 52), c2+"A", font=font, fill="white")

                draw.text((90, 14), "S:100%", font=font, fill="white")

                draw.text((90, 24), "T:"+t+"F", font=font, fill="white")

                draw.text((90, 34), "H:"+h+"%", font=font, fill="white")

        time.sleep(0.1)

def background():
    global temp1
    global temp2
    global temp3
    global temp
    global humidity
    global current1
    global current2
    global heartbeat_ts
    global status

    ctx = zmq.Context()
    sub = ctx.socket(zmq.SUB)
    sub.connect("tcp://127.0.0.1:4000")

    sub.setsockopt(zmq.SUBSCRIBE, "temp1")
    sub.setsockopt(zmq.SUBSCRIBE, "temp2")
    sub.setsockopt(zmq.SUBSCRIBE, "temp3")
    sub.setsockopt(zmq.SUBSCRIBE, "temperature")
    sub.setsockopt(zmq.SUBSCRIBE, "humidity")
    sub.setsockopt(zmq.SUBSCRIBE, "current1")
    sub.setsockopt(zmq.SUBSCRIBE, "current2")
    sub.setsockopt(zmq.SUBSCRIBE, "heartbeat")

    while True:
        string = sub.recv_string()
        print "Recv: ["+string+"]\n"
        sensor, val, v = string.split()

        if sensor == "temp1":
            temp1 = val
            temp1_v = int(v)
#            print "New Temp1: ["+temp1+"]\n"

        if sensor == "temp2":
            temp2 = val
	    temp2_v = int(v) 
#            print "New Temp2: ["+temp2+"]\n"

        if sensor == "temp3":
            temp3 = val 
            temp3_v = int(v)
#            print "New Temp3: ["+temp3+"]\n"

        if sensor == "temperature":
            temp = val
            temp_v = int(v) 
#            print "New Temp: ["+temp+"]\n"

        if sensor == "humidity":
            humidity = val
            humidity_v = int(v)
#            print "New Humidity: ["+humidity+"]\n"

        if sensor == "current1":
            current1 = val
            current1_v = int(v) 
#            print "Current 1: ["+current1+"]\n"

        if sensor == "current2":
            current2 = val
            current2_v = int(v) 
#            print "Current 2: ["+current2+"]\n"

        if sensor == "heartbeat":
            heartbeat_ts = int(time.time())
            system_status = int(val)
            print "Heartbeat: ["+str(heartbeat_ts)+"]"

def background_th():
    global temp
    global humidity 

    ctx = zmq.Context()
    sub = ctx.socket(zmq.SUB)
    sub.connect("tcp://127.0.0.1:3001")

    sub.setsockopt(zmq.SUBSCRIBE, "temp")
    sub.setsockopt(zmq.SUBSCRIBE, "humidity")

    while True:
        string = sub.recv_string()
#        print "Recv: ["+string+"]\n"
        sensor, val = string.split()

        if sensor == "temp":
            temp = str(int(round(float(val))))
#            print "New Temp: ["+temp+"]\n"

        if sensor == "humidity":
            humidity = str(int(round(float(val))))
#            print "New Humidity: ["+humidity+"]\n"

def background_current():
    global current1
    global current2

    ctx = zmq.Context()
    sub = ctx.socket(zmq.SUB)
    sub.connect("tcp://127.0.0.1:3002")

    sub.setsockopt(zmq.SUBSCRIBE, "current1")
    sub.setsockopt(zmq.SUBSCRIBE, "current2")

    while True:
        string = sub.recv_string()
#        print "Recv: ["+string+"]\n"
        sensor, val = string.split()

        if sensor == "current1":
            current1 = str(float(val))
#            print "Current 1: ["+current1+"]\n"

        if sensor == "current2":
            current2 = str(float(val))
#            print "Current 2: ["+current2+"]\n"


if __name__ == "__main__":
    try:
        thread1 = threading.Thread(target=background, args=())
        thread1.daemon = True
        thread1.start()

#        thread2 = threading.Thread(target=background_th, args=())
#        thread2.daemon = True
#        thread2.start()

#        thread3 = threading.Thread(target=background_current, args=())
#        thread3.daemon = True
#        thread3.start()

        main()
    except KeyboardInterrupt:
        pass
