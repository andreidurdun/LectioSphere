# Folosește o imagine oficială Python
FROM python:3

# Setează directorul de lucru în container
WORKDIR /app

# Copiază fișierele requirements.txt în container
COPY requirements.txt /app/

# Instalează dependențele
RUN pip install --no-cache-dir -r requirements.txt

# Copiază codul aplicației în container
COPY . /app/

# Expune portul pe care rulează Django (implicit 8000)
EXPOSE 8000

# Comanda implicită pentru a porni serverul Django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]