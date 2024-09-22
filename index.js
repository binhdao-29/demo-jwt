import express from 'express'
import cors from 'cors'
import config from './config.js'
import router from './router.js'


const app  = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('', router);

app.listen(config.port, function() {
  console.log("Server demo listening on port " + config.port)
})

