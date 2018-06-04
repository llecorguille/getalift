FROM node:latest

# This is the Dockerfile used to build the Docker image and container
# for the backend of the GetALift app.
#
# If you don't know how Docker works, you better go read the docs 
# before updating something here.


# We load the package.json before the code.
# With that, Docker only install dependancies if this file change.
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /usr/src/app && cp -a /tmp/node_modules /usr/src/app/

# We change the WORKDIR to the server directory.
WORKDIR /usr/src/app

# And we copy every file we need.
COPY . /usr/src/app

# Finally, we expose the port 3000...
EXPOSE 3000

# And we launch the server.
CMD ["npm", "start"]
