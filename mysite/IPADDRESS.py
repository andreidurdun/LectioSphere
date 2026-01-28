import os
from environs import Env

env = Env()
env.read_env()

def getIP():
    return env.str('HOST_IP')
