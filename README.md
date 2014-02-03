# diymailin

## example

```
CONFIG=config.json PASSWORD=topsecret SMTP_PORT=1025 PORT=3000 npm start
```

* use `config.json` to store and retrieve email-to-url configurations
* use `http://localhost:3000/` as web interface to add config into `config.json`
	* only accessible with HTTP Basic Authentication password `topsecret`
* run SMTP server at port `1025`
* when email comes into SMTP server
	* if any of the recipient is configured in `config.json`
		* HTTP POST `message` param to configured `url`
		* if HTTP POST get error, tell remote SMTP client email was rejected
		* otherwise, tell remote SMTP client email was accepted
	* otherwise, tell remote SMTP client email was rejected
