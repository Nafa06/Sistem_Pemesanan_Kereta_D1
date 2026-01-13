# Pake base image yang ringan
FROM node:18-alpine

# Set folder kerja di dalam container
WORKDIR /usr/src/app

# Copy package.json dulu biar caching-nya optimal
COPY package*.json ./

# Hapus node_modules lama jika ada
RUN rm -rf node_modules package-lock.json

# Install dependencies baru
RUN npm install --legacy-peer-deps

# Copy sisa kodingan (app.js, views, dll)
COPY . .

# Expose port internal aplikasi (sesuai app.js)
EXPOSE 3000

# Jalanin aplikasinya
CMD ["node", "app.js"]