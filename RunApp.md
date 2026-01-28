Environment config:

- In "mysite" create a ".env" file containing the constants:

HOST_IP -> your local IP address / the adress you want your app to work on

- In "LectioSphere" create a ".env" file contaning the constants:

EXPO_PUBLIC_HOST_IP -> your local IP address / the address you want to test your app on



Server-Side Backend:

- Go to ./mysite and build a docker image based on the "mysite" backend:

docker build -t backend .

- If you're running the backend config for the first time, create a new container for the app:

docker run -d --name backendContainer --env-file .env -p 8000:8000 backend

- If it's not your first time running the app on your PC, just start the already existing container:

docker start backendContainer



Frontend:

npx expo start

For cloud version:
- first time:
npx eas-cli build --profile development --platform android
- from second onwards:
npx expo start --dev-client --clear
        or
npx expo start --dev-client --clear --tunnel