/* eslint-disable no-console */
/* eslint-disable import/extensions */
// External dependencies
const express = require('express');

const router = express.Router();

// data switching middleware
router.use((req, res, next) => {
  // eslint-disable-next-line prefer-destructuring
  const nhsNumber = req.query.nhsNumber;
  if (nhsNumber) {
    req.session.data.nhsNumber = nhsNumber;
    const patientEntry = req.session.data.patients.find((p) => p[nhsNumber]);
    // and transform data
    const patient = patientEntry ? patientEntry[nhsNumber] : null;
    if (patient) {
      req.session.data.patient = patient;
      res.locals.patient = patient;
    } else {
      console.log('No patient found with that NHS number.');
    }
  } else {
    res.locals.patient = req.session.data.patient;
  }
  next();
});

// data logging middleware
router.use((req, res, next) => {
  const log = {
    method: req.method,
    url: req.originalUrl,
    data: req.session.data,
  };
  // you can enable this in your .env file
  if (process.env.LOGGING === 'TRUE') {
    // console.log(JSON.stringify(log, null, 2));
  }
  next();
});

// Add your routes here - above the module.exports line
require('./views/v1/_routes.js')(router);
require('./views/v2/_routes.js')(router);
require('./views/live/_routes.js')(router);
require('./views/epsmvp/_routes.js')(router);
module.exports = router;
