import subprocess
import time
from pyngrok import ngrok

NODE_PORT = 3000

# 1. Levanta el servidor Node.js
node_proc = subprocess.Popen(["node", "index.js"])

try:
    public_url = ngrok.connect(f"http://localhost:{NODE_PORT}", bind_tls=True).public_url
    #ngrok connect http://localhost:3000 
    print(f"Túnel ngrok abierto en: {public_url}")
    print(f"Configura tu webhook para apuntar a: {public_url}/circleback_webhook")

    while node_proc.poll() is None:
        time.sleep(2)
except KeyboardInterrupt:
    print("Cerrando servidor y túnel ngrok...")
finally:
    node_proc.terminate()
    ngrok.kill()
