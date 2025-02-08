# Usamos la imagen oficial de Node.js (versión 18)
FROM node:18

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos del proyecto al contenedor
COPY . .

# Instalamos las dependencias y construimos la aplicación
RUN npm install && npm run build

# Instalamos "serve" para servir la aplicación estática
RUN npm install -g serve

# Exponemos el puerto 3000
EXPOSE 3000

# Ejecutamos "serve" para servir los archivos de React
CMD ["serve", "-s", "dist", "-l", "3000"]
