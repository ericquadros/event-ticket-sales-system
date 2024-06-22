package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"

	"github.com/gorilla/mux"
)

// Estruturas de dados para eventos e spots
type Event struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Organization string `json:"organization"`
	Date         string `json:"date"`
	Price        int    `json:"price"`
	Rating       string `json:"rating"`
	ImageURL     string `json:"image_url"`
	CreatedAt    string `json:"created_at"`
	Location     string `json:"location"`
}

type Spot struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	Status  string `json:"status"`
	EventID int    `json:"event_id"`
}

type Data struct {
	Events []Event `json:"events"`
	Spots  []Spot  `json:"spots"`
}

var (
	data  Data
	mutex sync.Mutex // Mutex para sincronizar o acesso aos dados em memória
)

// Carrega dados do arquivo JSON
func loadData() {
	file, err := os.Open("data.json")
	if err != nil {
		log.Fatalf("Failed to open data file: %s", err)
	}
	defer file.Close()

	byteValue, err := ioutil.ReadAll(file)
	if err != nil {
		log.Fatalf("Failed to read data file: %s", err)
	}

	err = json.Unmarshal(byteValue, &data)
	if err != nil {
		log.Fatalf("Failed to unmarshal data: %s", err)
	}
}

// Handler para listar todos os eventos
func getEvents(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data.Events)
}

// Handler para criar um novo evento
func createEvent(w http.ResponseWriter, r *http.Request) {
	var newEvent Event

	// Decodificar o corpo da solicitação para o novo evento
	if err := json.NewDecoder(r.Body).Decode(&newEvent); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	mutex.Lock()
	defer mutex.Unlock()

	// Adicionar um ID único ao novo evento
	newEvent.ID = len(data.Events) + 1
	data.Events = append(data.Events, newEvent)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newEvent)
}

// Handler para listar um evento específico
func getEvent(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	params := mux.Vars(r)
	eventID, _ := strconv.Atoi(params["eventId"])

	for _, event := range data.Events {
		if event.ID == eventID {
			json.NewEncoder(w).Encode(event)
			return
		}
	}

	http.Error(w, "Event not found", http.StatusNotFound)
}

// Handler para listar os lugares de um evento específico
func getSpots(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	params := mux.Vars(r)
	eventID, _ := strconv.Atoi(params["eventId"])

	var eventSpots []Spot
	for _, spot := range data.Spots {
		if spot.EventID == eventID {
			eventSpots = append(eventSpots, spot)
		}
	}

	json.NewEncoder(w).Encode(eventSpots)
}

// Handler para reservar um lugar
func reserveSpot(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	params := mux.Vars(r)
	eventID, _ := strconv.Atoi(params["eventId"])

	var requestBody struct {
		Spots []string `json:"spots"`
	}

	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	mutex.Lock()
	defer mutex.Unlock()

	for _, spotName := range requestBody.Spots {
		for i, spot := range data.Spots {
			if spot.EventID == eventID && spot.Name == spotName {
				if spot.Status == "reserved" {
					http.Error(w, fmt.Sprintf("Spot %s is already reserved", spotName), http.StatusBadRequest)
					return
				}

				data.Spots[i].Status = "reserved"
				break
			}
		}
	}

	w.WriteHeader(http.StatusNoContent)
}

func main() {
	loadData()

	r := mux.NewRouter()
	r.HandleFunc("/events", getEvents).Methods("GET")
	r.HandleFunc("/events", createEvent).Methods("POST")
	r.HandleFunc("/events/{eventId}", getEvent).Methods("GET")
	r.HandleFunc("/events/{eventId}/spots", getSpots).Methods("GET")
	r.HandleFunc("/events/{eventId}/reserve", reserveSpot).Methods("POST")

	fmt.Println("Server is running on port 8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
