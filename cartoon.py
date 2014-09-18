# -*- coding: utf-8 -*-

import time, sys
from threading import Thread

sys.path.append("../lib")

from cflib.crazyflie import Crazyflie, State
from cflib.crtp.radiodriver import RadioDriver

import logging

logging.basicConfig(level=logging.ERROR)


class CrazyflieCustomLink(Crazyflie):
    def open_link_custom(self, link_uri, link):
        self.connection_requested.call(link_uri)
        self.state = State.INITIALIZED
        self.link_uri = link_uri
        try:
            self.link = link
            self.packet_received.add_callback(self._check_for_initial_packet_cb)
            self._start_connection_setup()
        except Exception as ex:  # pylint: disable=W0703
            # We want to catch every possible exception here and show
            # it in the user interface
            import traceback

            logger.error("Couldn't load link driver: %s\n\n%s",
                         ex, traceback.format_exc())
            exception_text = "Couldn't load link driver: %s\n\n%s" % (
                ex, traceback.format_exc())
            if self.link:
                self.link.close()
                self.link = None
            self.connection_failed.call(link_uri, exception_text)


class CartoonDrone:
    def __init__(self, linkUrl):
        """ Initialize and run the example with the specified link_uri """
        self._driver = RadioDriver()

        self._cf = CrazyflieCustomLink()

        self._cf.connected.add_callback(self._connected)
        self._cf.disconnected.add_callback(self._disconnected)
        self._cf.connection_failed.add_callback(self._connection_failed)
        self._cf.connection_lost.add_callback(self._connection_lost)

        self._driver.connect(linkUrl, self._cf._link_quality_cb, self._cf._link_error_cb)
        self._cf.open_link_custom('drone', self._driver)

    def _connected(self, link_uri):
        Thread(target=self._control_drone).start()

    def _connection_failed(self, link_uri, msg):
        print "Connection to %s failed: %s" % (link_uri, msg)

    def _connection_lost(self, link_uri, msg):
        print "Connection to %s lost: %s" % (link_uri, msg)

    def _disconnected(self, link_uri):
        print "Disconnected from %s" % link_uri

    def _control_drone(self):
        thrust_mult = 1
        thrust_step = 2500
        min_thrust = 20000
        max_thrust = 30000
        thrust = min_thrust
        pitch = 0
        roll = 0
        yawrate = 0
        while thrust >= min_thrust:
            print thrust
            self._cf.commander.send_setpoint(roll, pitch, yawrate, thrust)
            time.sleep(0.1)
            if thrust >= max_thrust:
                # time.sleep(2)
                thrust_mult = -1
            thrust += thrust_step * thrust_mult
        self._cf.commander.send_setpoint(0, 0, 0, 0)
        # Make sure that the last packet leaves before the link is closed
        # since the message queue is not flushed before closing
        time.sleep(0.1)
        self._cf.close_link()

if __name__ == '__main__':
    drone1 = CartoonDrone('radio://0/5/2M')
    drone2 = CartoonDrone('radio://1/10/2M')
