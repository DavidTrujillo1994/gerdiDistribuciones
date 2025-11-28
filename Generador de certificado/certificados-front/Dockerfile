FROM node:18-alpine

WORKDIR /app

RUN npm install -g http-server

# 👇 copiamos SOLO el build del navegador
COPY dist/certificados-laborales/browser/ ./browser/

EXPOSE 4200

# 👇 servimos la carpeta browser
CMD ["http-server", "browser", "-p", "4200", "-a", "0.0.0.0"]