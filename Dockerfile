FROM nginx:alpine
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; } location /health { return 200 "OK"; } }' > /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
EXPOSE 80
