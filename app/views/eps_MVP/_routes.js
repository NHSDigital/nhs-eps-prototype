module.exports = (router) => {

  router.get('/eps_mvp/search', function (req, res) {
    // check for clear
    let refine = req.query.refine || 'false';
    let lastSearch = req.session.data["last-search"];
    let target = 'eps_mvp/search';
    if (lastSearch === 'basic') {
      target = 'eps_mvp/search-basic';
    } else if (lastSearch === 'advanced') {
      target = 'eps_mvp/search-advanced';
    } else {
      target = 'eps_mvp/search';
    }

    return res.render(target, {
      'refine': refine
    })
  })

  //search via presc number
// search via presc number form
router.post("/eps_mvp/search-presc-post", function (req, res) {
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
      return Object.values(p).some(patient => patient.prescriptionNo === prescNumber);
  });

  // Extract the patient object from the patientEntry
  let patient = patientEntry ? Object.values(patientEntry).find(patient => patient.prescriptionNo === prescNumber) : null;

  if (patient) {
      // Assuming that the patient object has an nhsNumber field
      const nhsNumber = patient.nhsNumber;

      if (!nhsNumber) {
          console.log("Patient found but no NHS number available.");
          req.session.data.patient = null;
          return res.redirect("search");
      }

      console.log("Patient found:", patient);
      req.session.data.patient = patient;
      return res.redirect(`search-results?nhsNumber=${nhsNumber}`);
  } else {
      console.log("No patient found with that prescription number.");
      req.session.data.patient = null;
      return res.redirect("search");
  }
});

  // search via nhs number form
  router.post("/eps_mvp/search-nhs-post", function (req, res) {
    let nhsNumber = req.body["nhsNumber"].replace(/\s/g, ''); // Remove spaces on server side
    req.session.data.errors = {};

    if (!nhsNumber) {
        req.session.data.errors["nhs-number"] = true;
        return res.redirect("search-nhs");
    }
    // If there is no submitted option
    if (!nhsNumber) {
      req.session.data.errors["nhs-number"] = true;
      return res.redirect("search-nhs");
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
      res.redirect("search-results");
    }

    req.session.data.patient = patient;
    console.log("Received NHS Number:", nhsNumber);
    res.redirect(`search-results?nhsNumber=${nhsNumber}`);
  });


  // search via nhs basic search
  router.post("/eps_mvp/search-basic-post", function (req, res) {
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
  router.post("/eps_mvp/change-record", function (req, res) {
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


  router.post("/eps_mvp/switch-layout", function (req, res) {
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

  router.get('/eps_mvp/patient-details', function (req, res) {
    const target = req.query.tab;
    if (target) {

    } else {

    }
    return res.render('eps_mvp/patient-details', {'target': target})
  })

  // switcher routing

  router.post('/eps_mvp/switch', function (req, res) {
    // grab the bit of the url we need to se the redirect to the same page
    var url = req.get('Referrer') .split( '/' );
    res.redirect('/eps_mvp/' + url[4] )
  })
 
  
 //search results page
  router.get("/eps_mvp/search-results", function (req, res, next) {
    // Get the NHS number from the query parameters
    const nhsNumber = req.query["nhsNumber"] ? req.query["nhsNumber"].trim() : '';
    console.log('Received NHS Number:', nhsNumber);

    // Extract patients from session data
    const patientsArray = req.session.data.patients || [];
    console.log('Session Patients Array:', patientsArray);

    const returnedPatientsList = {};

    // Ensure nhsNumber is not empty
    if (nhsNumber) {
        // Iterate through each patient record in the array
        for (const patientObject of patientsArray) {
            for (const [patientNhsNumber, patient] of Object.entries(patientObject)) {
                console.log('Checking patient NHS Number:', patientNhsNumber, 'Patient Data:', patient);
                // Compare NHS numbers (trimmed)
                if (patientNhsNumber.trim() === nhsNumber) {
                    console.log('Match found:', patientNhsNumber);
                    returnedPatientsList[patientNhsNumber] = patient;
                    break;  // Stop after finding the patient
                }
            }
        }
    } else {
        console.log('No NHS Number provided.');
    }

    console.log('Returned Patients List:', returnedPatientsList);

    // Render the search results page with the returned patient list
    res.render('./eps_mvp/search-results', {
        returnedPatientsList: returnedPatientsList
    });
});





}