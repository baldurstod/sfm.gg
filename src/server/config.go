package main

type Config struct {
	HTTP     `json:"http"`
	Sessions `json:"sessions"`
}

type HTTP struct {
	Port          int    `json:"port"`
	HttpsKeyFile  string `json:"https_key_file"`
	HttpsCertFile string `json:"https_cert_file"`
}

type Sessions struct {
	ConnectURI  string `json:"connect_uri"`
	DBName      string `json:"db_name"`
	Collection  string `json:"collection"`
	Secret      string `json:"secret"`
	SessionName string `json:"session_name"`
}
