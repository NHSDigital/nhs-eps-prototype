module.exports = (router) => {

  router.get('/epsv10/search', function (req, res) {
    // check for clear
    let refine = req.query.refine || 'false';
    let lastSearch = req.session.data["last-search"];
    let target = 'epsv10/search';
    if (lastSearch === 'basic') {
      target = 'epsv10/search-basic';
    } else if (lastSearch === 'advanced') {
      target = 'epsv10/search-advanced';
    } else {
      target = 'epsv10/search';
    }

    return res.render(target, {
      'refine': refine
    })
  })

  //search via presc number
// search via presc number form
router.post("/epsv10/search-presc-post", function (req, res) {
  const prescNumber = req.body["prescNumber"];
  req.session.data.errors = {};

  // If there is no submitted option
  if (!prescNumber) {
      req.session.data.errors["presc-number"] = true;
      return res.redirect("search");
  }

  console.log("Searching for prescription number:", prescNumber);

  // Find the patient by prescription number
  let patientEntry = req.session.data.patients.find(p => {
      return Object.values(p).some(patient => patient.prescriptionNo.includes(prescNumber));
  });

  // Extract the patient object from the patientEntry
  let patient = patientEntry ? Object.values(patientEntry).find(patient => patient.prescriptionNo.includes(prescNumber)) : null;

  if (patient) {
      // Assuming that the patient object has an nhsNumber field
      const nhsNumber = patient.nhsNumber;

      if (!nhsNumber) {
          console.log("Patient found but no NHS number available.");
          req.session.data.patient = null;
          return res.redirect("search");
      }

      console.log("Patient with that prescription found: " + patient.nhsNumber + ", " + patient.firstName + " " + patient.lastName);

      // Save the patient and prescription data to the session
      req.session.data.patient = patient;
      req.session.data.prescriptionID = prescNumber;

      // Redirect directly to prescription results
      return res.redirect(`prescription-results?nhsNumber=${nhsNumber}&prescID=${prescNumber}`);
  } else {
      console.log("No patient found with that prescription number.");
      req.session.data.patient = null;
      return res.redirect("search");
  }
});

 // Search via NHS number form
router.post("/epsv10/search-nhs-post", function (req, res) {
  let nhsNumber = req.body["nhsNumber"].replace(/\s/g, ''); // Remove spaces on server side
  req.session.data.errors = {};

  if (!nhsNumber) {
      req.session.data.errors["nhs-number"] = true;
      return res.redirect("search-nhs");
  }

  // Find the patient by NHS number
  let patientEntry = req.session.data.patients.find(p => p[nhsNumber]);

  // Extract patient object
  let patient = patientEntry ? patientEntry[nhsNumber] : null;

  if (patient) {
      // Log the patient details
      console.log("Patient found:", patient.nhsNumber, patient.firstName, patient.lastName);

      // Save the patient data to the session
      req.session.data.patient = patient;

      // Redirect directly to the prescription results page
      return res.redirect(`prescription-results?nhsNumber=${nhsNumber}`);
  } else {
      console.log("No patient found with that NHS number.");
      req.session.data.patient = null;

      // Redirect to the search page with an error
      req.session.data.errors["nhs-number"] = true;
      return res.redirect("search-nhs");
  }
});



  // search via nhs basic search
  router.post("/epsv10/search-basic-post", function (req, res) {
    let patients = req.session.data['patients']; // Assumes patients data is stored in session

    let searchPostcode = req.body["postcode-only"];
    let searchLastName = req.body["last-name"];
    let dobDay = req.body['dob-day'] || '';
    let dobMonth = req.body['dob-month'] || '';
    let dobYear = req.body['dob-year'] || '';

    req.session.data.errors = {};

    if (!searchPostcode && !searchLastName && !dobDay && !dobMonth && !dobYear) {
        req.session.data.errors["basicSearch"] = true;
        return res.redirect("search-basic");
    }

    // Convert numeric month to abbreviated month name
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let formattedInputDob = dobDay && dobMonth && dobYear
        ? `${dobDay}-${monthNames[parseInt(dobMonth, 10) - 1]}-${dobYear}`
        : '';

    console.log("Formatted Input DOB:", formattedInputDob); // Debugging line

    let results = [];
    for (let nhsNumber in patients) {
        let patient = patients[nhsNumber];

        console.log(`Checking patient ${nhsNumber}:`, patient); // Debugging line

        // Check if searchLastName and patient.lastName are both defined before comparing
        let lastNameMatches = searchLastName && patient.lastName && patient.lastName.toLowerCase() === searchLastName.toLowerCase();
        console.log(`Last Name Matches: ${lastNameMatches}`); // Debugging line

        // Check if the postcode matches any of the defined address fields
        let postcodeMatches = searchPostcode && (
            (patient.usualAddress && patient.usualAddress.includes(searchPostcode.toUpperCase()))
        );
        console.log(`Postcode Matches: ${postcodeMatches}`); // Debugging line

        // Check if the date of birth matches
        let dobMatches = formattedInputDob && patient.dob === formattedInputDob;
        console.log(`DOB Matches: ${dobMatches}`); // Debugging line

        // If any of the conditions match, add the NHS number to the results
        if (lastNameMatches || postcodeMatches || dobMatches) {
            results.push(nhsNumber);
            console.log(`NHS Number: ${nhsNumber}`); // Debugging line
        }
    }

    req.session.data['results'] = results;
    
    // Generate query string with results
    let queryString = results.map(n => `nhsNumber=${n}`).join('&');
    res.redirect(`search-results?${queryString}`);
});


// change record via a NHS number on NoK section
  router.post("/epsv10/change-record", function (req, res) {
    const nhsNumber = req.body["change-by-nhs"];
    req.session.data.errors = {};

    // If there is no submitted option
    if (!nhsNumber) {
      req.session.data.errors["nhs-number"] = true;
      return res.redirect("search");
    }

    // Find the patient by NHS number
    let patientEntry = req.session.data.patients.find(p => p[nhsNumber]);

    // and transform data
    let patient = patientEntry ? patientEntry[nhsNumber] : null;


    if (patient) {
      // Here you can handle the found patient object
      console.log("Patient found:", patient[nhsNumber]);
    } else {
      console.log("No patient found with that NHS number.");
      res.redirect("search");
    }

    req.session.data.patient = patient;

    res.redirect(`patient-overview`);
  });


  router.post("/epsv10/switch-layout", function (req, res) {
    let columns = req.session.data["layout"];

    if (columns === 'oneCol') {
      console.log("switched to 2 column layout:");
      columns = 'twoCol';
    } else {
      console.log("switched to 1 column layout:");
      columns = 'oneCol';
    }
    // save the change
    req.session.data["layout"] = columns;
    // relaod the page
    res.redirect(`patient-details`);
  });

  router.get('/epsv10/patient-details', function (req, res) {
    const target = req.query.tab;
    if (target) {

    } else {

    }
    return res.render('epsv10/patient-details', {'target': target})
  })

  // switcher routing

  router.post('/epsv10/switch', function (req, res) {
    // grab the bit of the url we need to se the redirect to the same page
    var url = req.get('Referrer') .split( '/' );
    res.redirect('/epsv10/' + url[4] )
  })
 
  
 //search results page
  router.get("/epsv10/search-results", function (req, res, next) {
    // Get the NHS number from the query parameters
    const nhsNumber = req.query["nhsNumber"] ? req.query["nhsNumber"].trim() : '';
    // console.log('Received NHS Number:', nhsNumber);

    // Extract patients from session data
    const patientsArray = req.session.data.patients || [];
    // console.log('Session Patients Array:', patientsArray);

    const returnedPatientsList = {};

    // Ensure nhsNumber is not empty
    if (nhsNumber) {
        // Iterate through each patient record in the array
        for (const patientObject of patientsArray) {
            for (const [patientNhsNumber, patient] of Object.entries(patientObject)) {
                // console.log('Checking patient NHS Number:', patientNhsNumber, 'Patient Data:', patient);
                // Compare NHS numbers (trimmed)
                if (patientNhsNumber.trim() === nhsNumber) {
                    // console.log('Match found:', patientNhsNumber);
                    returnedPatientsList[patientNhsNumber] = patient;
                    break;  // Stop after finding the patient
                }
            }
        }
    } else {
        console.log('No NHS Number provided.');
    }

    // console.log('Returned Patients List:', returnedPatientsList);

    // Render the search results page with the returned patient list
    res.render('./epsv10/search-results', {
        returnedPatientsList: returnedPatientsList
    });
  });

  //prescription search results page
  router.get("/epsv10/prescription-results", function (req, res, next) {
    // Get the details from the url query parameters
    const nhsNumber = req.query["nhsNumber"] ? req.query["nhsNumber"].trim() : '';
    const prescID = req.query["prescID"] ? req.query["prescID"].trim() : '';

    // pull all prescriptions from session data into a new array that we can loop through
    const prescriptionsArray = req.session.data.prescriptions || [];
    const patientsArray = req.session.data.patients || [];
    const returnedPatientsList = {};

    // Ensure nhsNumber is not empty
    if (nhsNumber) {
      // Iterate through each patient record in the array
      for (const patientObject of patientsArray) {
        for (const [patientNhsNumber, patient] of Object.entries(patientObject)) {
          // console.log('Checking patient NHS Number:', patientNhsNumber, 'Patient Data:', patient);
          // Compare NHS numbers (trimmed)
          if (patientNhsNumber.trim() === nhsNumber) {
            //console.log('Match found:', patientNhsNumber);
            returnedPatientsList[patientNhsNumber] = patient;
            var returnedPatientFirstName = patient.firstName;
            var returnedPatientLastName = patient.lastName;
          }
        }
      }
    }

    // create empty arrays to store the matched item objects, we'' pass these back to the page
    let returnedPrescriptionsListAll = [];
    let returnedPrescriptionsListCurrent = [];
    let returnedPrescriptionsListFuture = [];
    let returnedPrescriptionsListExpired = [];

    // If we have a prescription ID, use it to find the matching prescriptions
    if (prescID) {
      // look through the prescription array in the data file and add matches to the empty array
      returnedPrescriptionsListAll = prescriptionsArray.filter(item => item[Object.keys(item)[0]].prescriptionID === prescID);
    // else use the nhs number to find all prescriptions for that patient
    } else {
      // find the array of prescription ids
      patientPrescriptionsList = returnedPatientsList[nhsNumber].prescriptionNo;
      // loop through each and add to push matches to the returned list array
      patientPrescriptionsList.forEach(prescription => {
        // Filter the prescriptionsArray to find objects with a matching prescriptionID
        const matchedPrescriptions = prescriptionsArray.filter(item => item[Object.keys(item)[0]].prescriptionID === prescription);
        // Add all matched prescriptions to the returnedPrescriptionsListAll array
        returnedPrescriptionsListAll.push(...matchedPrescriptions);
      });
    }

    // Filter to show just the current prescriptions
    returnedPrescriptionsListCurrent = returnedPrescriptionsListAll.filter(item => {
      const key = Object.keys(item)[0];
      const prescription = item[key];
      // how we filter the list down
      return prescription.prescriptionStatus !== 'Future issue date' && prescription.prescriptionStatus !== 'Future repeat dispense' && prescription.prescriptionStatus !== 'Expired' && prescription.prescriptionStatus !== 'Claimed';;
    }).map(item => {
      const key = Object.keys(item)[0];
      const prescription = item[key];
      return {
        ID: prescription.prescriptionID,
        Variant: prescription.prescriptionVariant,
        Type: prescription.prescriptionType,
        IssueDate: prescription.prescriptionIssueDate,
        Item1: prescription.prescriptionItem1,
        Item1Quantity: prescription.prescriptionItem1quantity,
        Item2: prescription.prescriptionItem2,
        Item2Quantity: prescription.prescriptionItem2quantity,
        Status: prescription.prescriptionStatus
      };
    });

    // Filter to show just the Future dated prescriptions
    returnedPrescriptionsListFuture = returnedPrescriptionsListAll.filter(item => {
      const key = Object.keys(item)[0];
      const prescription = item[key];
      // how we filter the list down
      return prescription.prescriptionStatus === 'Future issue date' || prescription.prescriptionStatus === 'Future repeat dispense';
    }).map(item => {
      const key = Object.keys(item)[0];
      const prescription = item[key];
      return {
        ID: prescription.prescriptionID,
        Variant: prescription.prescriptionVariant,
        Type: prescription.prescriptionType,
        IssueDate: prescription.prescriptionIssueDate,
        Item1: prescription.prescriptionItem1,
        Item1Quantity: prescription.prescriptionItem1quantity,
        Item2: prescription.prescriptionItem2,
        Item2Quantity: prescription.prescriptionItem2quantity,
        Status: prescription.prescriptionStatus
      };
    });

    // Filter to show just the Future dated prescriptions
    returnedPrescriptionsListExpired = returnedPrescriptionsListAll.filter(item => {
      const key = Object.keys(item)[0];
      const prescription = item[key];
      // how we filter the list down
      return prescription.prescriptionStatus === 'Expired' || prescription.prescriptionStatus === 'Claimed';
    }).map(item => {
      const key = Object.keys(item)[0];
      const prescription = item[key];
      return {
        ID: prescription.prescriptionID,
        Variant: prescription.prescriptionVariant,
        Type: prescription.prescriptionType,
        IssueDate: prescription.prescriptionIssueDate,
        Item1: prescription.prescriptionItem1,
        Item1Quantity: prescription.prescriptionItem1quantity,
        Item2: prescription.prescriptionItem2,
        Item2Quantity: prescription.prescriptionItem2quantity,
        Status: prescription.prescriptionStatus
      };
    });

    // Render the search results page with the filtered prescription lists
    res.render('./epsv10/prescription-results', {
      returnedPrescriptionsListAll: returnedPrescriptionsListAll,
      returnedPrescriptionsListCurrent: returnedPrescriptionsListCurrent,
      returnedPrescriptionsListFuture: returnedPrescriptionsListFuture,
      returnedPrescriptionsListExpired: returnedPrescriptionsListExpired,
      returnedPatientFirstName: returnedPatientFirstName,
      returnedPatientLastName: returnedPatientLastName
  });
  });

}