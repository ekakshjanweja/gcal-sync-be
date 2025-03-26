# Variables
CONTAINER_NAME=postgres-local-gcalsync
IMAGE_NAME=postgres-local-image
HOST_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=gcalsyncdb
DATA_DIR=~/dev/browser-use/.data/gcal-sync/postgres-data
DOCKERFILE=./Dockerfile

# Build the Docker image
build:
	docker build -t $(IMAGE_NAME) -f $(DOCKERFILE) .

# Create the data directory if it doesn't exist
$(DATA_DIR):
	mkdir -p $(DATA_DIR)

# Start the PostgreSQL container
start: $(DATA_DIR)
	docker run --name $(CONTAINER_NAME) \
		-e POSTGRES_USER=$(POSTGRES_USER) \
		-e POSTGRES_PASSWORD=$(POSTGRES_PASSWORD) \
		-e POSTGRES_DB=$(POSTGRES_DB) \
		-v $(DATA_DIR):/var/lib/postgresql/data \
		-p $(HOST_PORT):5432 \
		-d $(IMAGE_NAME)
	@echo "PostgreSQL is running on localhost:$(HOST_PORT)"
	@echo "Connection string: postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@localhost:$(HOST_PORT)/$(POSTGRES_DB)"

# Stop the PostgreSQL container
stop:
	docker stop $(CONTAINER_NAME) || true

# Remove the PostgreSQL container
remove:
	docker rm $(CONTAINER_NAME) || true

# Restart the PostgreSQL container
restart: stop remove start

# Execute psql in the container
psql:
	docker exec -it $(CONTAINER_NAME) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

# View logs
logs:
	docker logs $(CONTAINER_NAME)

# Clean everything
clean: remove
	sudo docker rmi $(IMAGE_NAME) || true
	sudo rm -rf $(DATA_DIR)

.PHONY: build start stop remove restart psql logs clean