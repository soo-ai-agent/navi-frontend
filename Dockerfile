FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# e2e 는 이미지에서 빼므로 tsconfig.e2e.json 은 빌드 대상에서 제외한다
RUN npx tsc -b tsconfig.app.json tsconfig.node.json && npx vite build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
