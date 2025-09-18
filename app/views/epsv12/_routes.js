module.exports = (router) => {

  router.get('/epsv12/search', function (req, res) {
    let refine = req.query.refine || 'false';
    let lastSearch = req.session.data["last-search"];
    let target = 'epsv12/search';


    if (lastSearch === 'basic') {
      target = 'epsv12/search-basic';
    } else if (lastSearch === 'advanced') {
      target = 'epsv12/search-advanced';
    }

    let errorType = req.query.error;
    let errors = {};

    if (errorType === "missing-presc-number") {
        errors["presc-number"] = "Enter a prescription ID number";
    } else if (errorType === "no-matching-presc") {
        errors["presc-number"] = "The prescription ID number is not recognised";
    } else if (errorType === "no-nhs-number") {
        errors["presc-number"] = "No NHS number found for this prescription";
    } else if (errorType === "special-character") {
      errors["presc-number"] = "The prescription ID number must contain only letters, numbers, dashes or the + character";
  }  else if (errorType === "too-many") {
    errors["presc-number"] = "The prescription ID number must contain 18 characters";
}

    return res.render('epsv12/search', {
      'errors': errors
    });
});



  //search via presc number
// search via presc number form
// Redirect via spinner after prescription search
router.post("/epsv12/search-presc-post", function (req, res) {
  const prescNumber = req.body["prescNumber"];
  req.session.data.errors = {};

  if (!prescNumber) {
    return res.redirect("search?error=missing-presc-number");
  }

  let patientEntry = req.session.data.patients.find(p => 
    Object.values(p).some(patient => patient.prescriptionNo.includes(prescNumber))
  );

  let patient = patientEntry ? Object.values(patientEntry).find(patient => patient.prescriptionNo.includes(prescNumber)) : null;

  if (patient) {
    const nhsNumber = patient.nhsNumber;

    if (!nhsNumber) {
      return res.redirect("search?error=no-nhs-number");
    }

    req.session.data.patient = patient;
    req.session.data.prescriptionID = prescNumber;
    req.session.data.searchTerm = 'prescription';

    // Redirect to the spinner
    return res.redirect(`spinner-prescription-list?nhsNumber=${nhsNumber}&prescID=${prescNumber}&searchTerm=prescription`);
  } else {
    return res.redirect("search?error=no-matching-presc");
  }
});

// Redirect via spinner after NHS number search
router.post("/epsv12/search-nhs-post", function (req, res) {
  const nhsNumber = req.body["nhsNumber"].replace(/\s/g, '');
  

  if (!nhsNumber) {
    return res.redirect("search-nhs?error=missing-nhs-number");
  }

  let patientEntry = req.session.data.patients.find(p => p[nhsNumber]);
  let patient = patientEntry ? patientEntry[nhsNumber] : null;

  if (patient) {
    req.session.data.patient = patient; 
    req.session.data.searchTerm = 'nhs';

    // Redirect to the spinner
    return res.redirect(`spinner-prescription-list?nhsNumber=${nhsNumber}&searchTerm=nhs`);
  } else {
    return res.redirect("search-nhs?error=no-matching-nhs");
  }
});

router.get('/epsv12/search-nhs', function (req, res) {
  let errorType = req.query.error;
  let errors = {};

  if (errorType === "missing-nhs-number") {
      errors["nhs-number"] = "Enter an NHS number";
  } else if (errorType === "no-matching-nhs") {
      errors["nhs-number"] = "No matching prescriptions found for this NHS number";
  } else if (errorType === "too-many-nums") {
    errors["nhs-number"] = "NHS number must contain 10 digits";
} else if (errorType === "special-chars") {
  errors["nhs-number"] = "NHS number must contain 10 digits, with no letters or special characters";
}

  return res.render('epsv12/search-nhs', {
    'errors': errors
  });
});



  // search via nhs basic search
  router.post("/epsv12/search-basic-post", function (req, res) {
    let patients = req.session.data['patients'] || {}; // Ensure patients is defined
    let searchPostcode = req.body["postcode-only"];
    let searchLastName = req.body["last-name"];
    let dobDay = req.body['dob-day'] || '';
    let dobMonth = req.body['dob-month'] || '';
    let dobYear = req.body['dob-year'] || '';
    let errors = [];
   // Validate surname
   if (!searchLastName) {
    errors.push("error=missing-last-name");
} else if (searchLastName.length < 2) {
    errors.push("error=short-last-name");
} else if (!/^[A-Za-z'-]+$/.test(searchLastName)) {
    errors.push("error=invalid-last-name");
}

// Validate postcode
if (!searchPostcode) {
    errors.push("error=missing-postcode");
}

// Date of birth validation logic
if (!dobDay && !dobMonth && !dobYear) {
    errors.push("error=missing-dob"); // General DOB error
} else {
    if (!dobDay) {
        errors.push("error=missing-dob-day");
    } else if (!/^\d{1,2}$/.test(dobDay)) {
        errors.push("error=invalid-dob-day");
    }
    
    if (!dobMonth) {
        errors.push("error=missing-dob-month");
    } else if (!/^\d{1,2}$/.test(dobMonth)) {
        errors.push("error=invalid-dob-month");
    }
    
    if (!dobYear) {
        errors.push("error=missing-dob-year");
    } else if (!/^\d{4}$/.test(dobYear)) {
        errors.push("error=invalid-dob-year");
    }
}

  // If there are errors, redirect back to the form
 
    // If there are errors, redirect with error messages in the URL
    if (errors.length > 0) {
      return res.redirect(`search-basic?${errors.join("&")}`);
  }

    // Ensure DOB is in correct format (e.g., '06-May-2013')
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    // Pad single digit day and month with leading zeros if necessary
    let paddedDobDay = dobDay.padStart(2, '0');
    let paddedDobMonth = monthNames[parseInt(dobMonth, 10) - 1]; // Convert month number to month name
    let formattedInputDob = dobYear && paddedDobDay && paddedDobMonth
        ? `${paddedDobDay}-${paddedDobMonth}-${dobYear}`
        : '';
    console.log("Formatted DOB:", formattedInputDob); // Log to verify the formatted DOB
    // Check for a specific date of birth (6-May-2013)
    if (formattedInputDob === '06-May-2013') {
        // Redirect to search-results-twins if DOB matches 6-May-2013
        return res.redirect('spinner-twin-list');
    } else {
        // Redirect to spinner-prescription-list for any other case
        req.session.data.searchTerm = 'basic';
        return res.redirect('spinner-prescription-list?nhsNumber=5900009890&searchTerm=basic');
    }
});

//get basic route
router.get('/epsv12/search-basic', function (req, res) {
  let errorTypes = req.query.error ? [].concat(req.query.error) : []; // Convert to array
  let errors = {};

  errorTypes.forEach((error) => {
      if (error === "missing-last-name") {
          errors["last-name"] = "Enter the patient's last name";
      } else if (error === "short-last-name") {
          errors["last-name"] = "Surname must be at least 2 characters long";
      } else if (error === "invalid-last-name") {
          errors["last-name"] = "Surname can only contain letters, hyphens, and apostrophes";
      } else if (error === "missing-postcode") {
          errors["postcode-only"] = "Enter the patient's postcode";
      } else if (error === "missing-dob") {
          errors["dob"] = "Enter the patient's date of birth";
      } else if (error === "missing-dob-day") {
          errors["dob-day"] = "Date of birth must include a day";
      } else if (error === "invalid-dob-day") {
          errors["dob-day"] = "Date of birth must include a valid day";
      } else if (error === "missing-dob-month") {
          errors["dob-month"] = "Date of birth must include a month";
      } else if (error === "invalid-dob-month") {
          errors["dob-month"] = "Date of birth must include a valid month";
      } else if (error === "missing-dob-year") {
          errors["dob-year"] = "Date of birth must include a year";
      } else if (error === "invalid-dob-year") {
          errors["dob-year"] = "Date of birth must include a valid year";
      } else if (error === "future-dob-year") {
        errors["dob-year"] = "Date of birth must be in the past";
    }
  });

  return res.render('epsv12/search-basic', { errors });
});


// change record via a NHS number on NoK section
  router.post("/epsv12/change-record", function (req, res) {
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


  router.post("/epsv12/switch-layout", function (req, res) {
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

  router.get('/epsv12/patient-details', function (req, res) {
    const target = req.query.tab;
    if (target) {

    } else {

    }
    return res.render('epsv12/patient-details', {'target': target})
  })

  // switcher routing

  router.post('/epsv12/switch', function (req, res) {
    // grab the bit of the url we need to se the redirect to the same page
    var url = req.get('Referrer') .split( '/' );
    res.redirect('/epsv12/' + url[4] )
  })
 
  
 // Search results page
router.get("/epsv12/search-results", function (req, res, next) {
  // Get NHS numbers from query parameters
  const nhsNumbers = req.query["nhsNumber"] ? [].concat(req.query["nhsNumber"]) : [];
  
  // Extract patients from session data
  const patients = req.session.data.patients || {};

  // Prepare returnedPatientsList
  const returnedPatientsList = {};
  nhsNumbers.forEach(nhsNumber => {
      if (patients[nhsNumber]) {
          returnedPatientsList[nhsNumber] = patients[nhsNumber];
      }
  });

  // Log an error message if no results found
  if (Object.keys(returnedPatientsList).length === 0) {
      console.log("No patients found for the provided NHS numbers.");
  }

  // Render the search results page
  res.render('./epsv12/search-results', {
      returnedPatientsList: returnedPatientsList,
      nhsNumbers: nhsNumbers // Renamed for clarity
  });
});

//...................................................................................................................
//..PPPPP.......................................................................................l....................
//.PPPPPPPPPP..................................................................................ull..lttt.............
//.PPPPPPPPPP..................................................................................ull..lttt.............
//.PPPPPPPPPPP.................................................................................ull..lttt.............
//.PPPP...PPPP.Prrrrr..eeeeee...esssssss...ccccccc....... rrrrr..eeeeee...esssssss.ssuu...uuu..ull.lltttt.tsssssss...
//.PPPP...PPPP.Prrrrr.reeeeeee..esssssss..scccccccc...... rrrrr.reeeeeee..esssssss.ssuu...uuu..ull.lltttt.tsssssss...
//.PPPPPPPPPPP.Prrrrrrreeeeeeeeeesssssssssscccccccc...... rrrrrrreeeeeeeeeessssssssssuu...uuu..ull.llttttttssssssss..
//.PPPPPPPPPPP.Prrr..rree..eeeeeesssssssssscc..cccc...... rrr..rree..eeeeeessssssssssuu...uuu..ull..lttt.ttssssssss..
//.PPPPPPPPPP..Prr...rreeeeeeee.esssssss.sscc............ rr...rreeeeeeee.esssssss.ssuu...uuu..ull..lttt..tsssssss...
//.PPPPPPPPP...Prr...rreeeeeeee.esssssss.sscc............ rr...rreeeeeeee.esssssss.ssuu...uuu..ull..lttt..tsssssss...
//.PPPP........Prr...rree......eesssssssssscc..cccc...... rr...rree......eessssssss.suu..uuuu..ull..lttt.ttssssssss..
//.PPPP........Prr...rreeeeeeeeeesss.sssssscccccccc...... rr...rreeeeeeeeeesss.ssss.suuuuuuuu..ull..lttt.ttsss.ssss..
//.PPPP........Prr...rreeeeeee.eessssssss.sccccccc....... rr...rreeeeeee.eessssssss.suuuuuuuu..ull..lttttttssssssss..
//.PPPP........Prr....reeeeeee..esssssss..sccccccc....... rr....reeeeeee..esssssss..suuuuuuuu..ull..ltttt.tsssssss...
//......................eeee.....ssssss.....cccc..................eeee.....ssssss.....uuu.............ttt..ssssss....
//...................................................................................................................

  //prescription search results page
  router.get("/epsv12/prescription-results", function (req, res, next) {
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
      return prescription.prescriptionStatus !== 'Future issue date' && prescription.prescriptionStatus !== 'Future repeat dispense'&& prescription.prescriptionStatus !== 'Future eRD issue' && prescription.prescriptionStatus !== 'Future prescription cancelled' && prescription.prescriptionStatus !== 'Expired' && prescription.prescriptionStatus !== 'Claimed' && prescription.prescriptionStatus !== 'Available to download when due' &&prescription.prescriptionStatus !== 'Future prescription cancelled';;
    }).map(item => {
      const key = Object.keys(item)[0];
      const prescription = item[key];
      return {
        ID: prescription.prescriptionID,
        Cancellation: prescription.pendingCancellation,
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
      return prescription.prescriptionStatus === 'Future issue date' || prescription.prescriptionStatus === 'Future repeat dispense'|| prescription.prescriptionStatus === 'Future eRD issue' || prescription.prescriptionStatus == 'Available to download when due' || prescription.prescriptionStatus == 'Future prescription cancelled';
    }).map(item => {
      const key = Object.keys(item)[0];
      const prescription = item[key];
      return {
        ID: prescription.prescriptionID,
        Cancellation: prescription.pendingCancellation,
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
        Cancellation: prescription.pendingCancellation,
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
    res.render('./epsv12/prescription-results', {
      returnedPrescriptionsListAll: returnedPrescriptionsListAll,
      returnedPrescriptionsListCurrent: returnedPrescriptionsListCurrent,
      returnedPrescriptionsListFuture: returnedPrescriptionsListFuture,
      returnedPrescriptionsListExpired: returnedPrescriptionsListExpired,
      returnedPatientFirstName: returnedPatientFirstName,
      returnedPatientLastName: returnedPatientLastName,
      searchTerm: req.query.searchTerm // Pass searchTerm here
  });
  });

//prescription search results page
router.get("/epsv12/prescription-results-pds", function (req, res, next) {
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
    return prescription.prescriptionStatus !== 'Future issue date' && prescription.prescriptionStatus !== 'Future prescription cancelled'&& prescription.prescriptionStatus !== 'Future issue date dispense' && prescription.prescriptionStatus !== 'Future repeat dispense'&& prescription.prescriptionStatus !== 'Future eRD issue' && prescription.prescriptionStatus !== 'Expired' && prescription.prescriptionStatus !== 'Claimed'&& prescription.prescriptionStatus !== 'Available to download when due' && prescription.prescriptionStatus !== 'Future prescription cancelled';;
  }).map(item => {
    const key = Object.keys(item)[0];
    const prescription = item[key];
    return {
      ID: prescription.prescriptionID,
      Cancellation: prescription.pendingCancellation,
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
    return prescription.prescriptionStatus === 'Future issue date' ||prescription.prescriptionStatus === 'Future prescription cancelled'|| prescription.prescriptionStatus === 'Future issue date dispense'|| prescription.prescriptionStatus === 'Future repeat dispense'|| prescription.prescriptionStatus === 'Future eRD issue'|| prescription.prescriptionStatus == 'Available to download when due' || prescription.prescriptionStatus == 'Future prescription cancelled';
  }).map(item => {
    const key = Object.keys(item)[0];
    const prescription = item[key];
    return {
      ID: prescription.prescriptionID,
      Cancellation: prescription.pendingCancellation,
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
      Cancellation: prescription.pendingCancellation,
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
  res.render('./epsv12/prescription-results-pds', {
    returnedPrescriptionsListAll: returnedPrescriptionsListAll,
    returnedPrescriptionsListCurrent: returnedPrescriptionsListCurrent,
    returnedPrescriptionsListFuture: returnedPrescriptionsListFuture,
    returnedPrescriptionsListExpired: returnedPrescriptionsListExpired,
    returnedPatientFirstName: returnedPatientFirstName,
    returnedPatientLastName: returnedPatientLastName,
    searchTerm: req.query.searchTerm // Pass searchTerm here
});
});

//................................................................
//..RRRRR..........OOOOOO......LL.........EEEEEEEEE....SSSSSS.....
//.RRRRRRRRRR.....OOOOOOOOO...LLLL.......EEEEEEEEEEE..SSSSSSSS....
//.RRRRRRRRRRR...OOOOOOOOOO...LLLL.......EEEEEEEEEEE.ESSSSSSSSS...
//.RRRRRRRRRRR..OOOOOOOOOOOO..LLLL.......EEEEEEEEEEE.ESSSSSSSSS...
//.RRRR...RRRRR.OOOO....OOOO..LLLL.......EEEE.......EESS...SSSSS..
//.RRRR...RRRRR.OOOO....OOOOO.LLLL.......EEEEEEEEEE.EESSSS........
//.RRRRRRRRRRR.ROOO......OOOO.LLLL.......EEEEEEEEEE..ESSSSSSSS....
//.RRRRRRRRRRR.ROOO......OOOO.LLLL.......EEEEEEEEEE..ESSSSSSSSS...
//.RRRRRRRRRRR.ROOO......OOOO.LLLL.......EEEEEEEEEE....SSSSSSSSS..
//.RRRR..RRRRR..OOOO....OOOOO.LLLL.......EEEE.......EESS..SSSSSS..
//.RRRR...RRRR..OOOO....OOOO..LLLL.......EEEE.......EESS....SSSS..
//.RRRR...RRRR..OOOOOOOOOOOO..LLLLLLLLLL.EEEEEEEEEEEEESSSSSSSSSS..
//.RRRR...RRRR...OOOOOOOOOO...LLLLLLLLLL.EEEEEEEEEEE.ESSSSSSSSS...
//.RRRR...RRRRR...OOOOOOOOO...LLLLLLLLLL.EEEEEEEEEEE..SSSSSSSSS...
//.................OOOOOO..............................SSSSSS.....
//................................................................


// Role selection journey
router.get('/epsv12/roles', (req, res) => {
  let roles = req.session.data.roles; // Retrieve roles from session data
  let { selection, cards, action, noAccess,singleRole, allRoles } = req.query;
 // Update session values based on query parameters
 if (selection) req.session.data.selection = selection;
 if (cards) req.session.data.cards = cards;
 if (noAccess) req.session.data.noAccess = noAccess;
 if(singleRole)req.session.data.singleRole = singleRole;
 if(action)req.session.data.action =action;
 if (allRoles) req.session.data.allRoles = allRoles; // Store allRoles parameter

 // Retrieve stored values if not provided in query params
 selection = selection || req.session.data.selection || "no";
 cards = cards || req.session.data.cards || "no";
 noAccess = noAccess || req.session.data.noAccess || "no";
 singleRole = singleRole || req.session.data.singleRole || "no";
 action = action || req.session.data.action || "no";
 allRoles = allRoles || req.session.data.allRoles || "no"; // Default to "no"

 let selectedRole = roles.find(role => role.selected === "yes") || null;

   // **Store roleId in session if a role is selected**
   if (selectedRole) {
    req.session.data.roleId = selectedRole.id;  
  } else {
    req.session.data.roleId = null; // Clear if no role is selected
  }
  
 // Check if we should skip the role selection page
  if (
    selection == "no" &&
    cards == "no" &&
    noAccess == "no" &&
    singleRole ==="yes" &&
    allRoles == "no" &&
    action == "no" 
  
  ) {
    let autoSelectedRole = roles[0];
    roles.forEach(role => role.selected = ""); // Clear previous selections
    autoSelectedRole.selected = "yes"; // Automatically select the single role
    req.session.data.roles = roles;
    req.session.data.roleId = autoSelectedRole.id;

    return res.redirect(`/epsv12/search?selection=${selection}&cards=${cards}&noAccess=${noAccess}&singleRole=${singleRole}&action=${action}&allRoles=${allRoles}`); // Redirect to search page
  }

 if (selection === "yes") {
   if (!selectedRole && roles.length > 0) {
     // Select the first available role if none is selected
     selectedRole = roles[0]; 
     roles.forEach(role => role.selected = ""); // Clear all selections
     selectedRole.selected = "yes"; // Set the first role as selected
     req.session.data.roleId = selectedRole.id;
     req.session.data.roleId = autoSelectedRole.id;
   }
 } else {
   roles.forEach(role => role.selected = ""); // Clear selection if selection=no
   selectedRole = null;
   req.session.data.roleId = null;
 }

 // Save updated roles back to session
 req.session.data.roles = roles;

 res.render('./epsv12/roles', { selection, cards, noAccess, roles, selectedRole, singleRole, allRoles });
});

// Locum role
router.get('/epsv12/roles-site-search-locum', (req, res) => {
  let locumsites = req.session.data.locumsites || []; // Retrieve from session or set default empty array
  let leedsLocumsites = req.session.data.leedsLocumsites || []; // Retrieve from session or set default empty array
  let oneLocumsites = req.session.data.oneSite || []; // Retrieve from session or set default empty array
  let roles = req.session.data.roles; // Retrieve roles from session data
  let selectedRole = roles.find(role => role.id === req.query.roleId); // Find role by ID

  if (!selectedRole) {
    return res.redirect('/epsv12/roles'); // Redirect if no role found
  }
// Update all roles: set `selected` to "" for all, then "yes" for the selected one
roles.forEach(role => role.selected = ""); 
selectedRole.selected = "yes"; 

// Save updated roles back to session
req.session.data.roles = roles;


console.log("Stored Role ID:", req.session.data.roleId);
  res.render('./epsv12/roles-site-search-locum', { locumsites, leedsLocumsites, oneLocumsites, selectedRole }); // Pass locumsites to the template
});

router.get('/epsv12/roles-confirm-locum', (req, res) => {
  let locumsites = req.session.data.locumsites || [];
  let leedsLocumsites = req.session.data.leedsLocumsites || [];
  let oneLocumsites = req.session.data.oneSite || [];

  let roles = req.session.data.roles || [];
  let roleId = req.query.roleId || (req.session.data.selectedRole ? req.session.data.selectedRole.id : null);

  let selectedRole = roles.find(role => role.id === roleId);

  if (!selectedRole) {
    return res.redirect('/epsv12/roles');
  }

  // Use the site from session if it exists (for back navigation)
  let selectedSite = req.session.data.selectedSite;

  if (!selectedSite) {
    if (req.query.locSite) {
      selectedSite = locumsites.find(site => site.id === req.query.locSite);
    } else if (req.query.leedsLoc) {
      selectedSite = leedsLocumsites.find(site => site.id === req.query.leedsLoc);
    } else if (req.query.oneLoc) {
      selectedSite = oneLocumsites.find(site => site.id === req.query.oneLoc);
    }
  }

  if (!selectedSite) {
    return res.redirect('/epsv12/roles');
  }

  // Store in session for back navigation
  req.session.data.selectedSite = selectedSite;
  req.session.data.selectedRole = selectedRole;

  res.render('./epsv12/roles-confirm-locum', { selectedRole, selectedSite });
});

//confirmed role
router.get('/epsv12/roles-confirm', (req, res) => {
  let roles = req.session.data.roles; // Retrieve roles from session data
  let selectedRole = roles.find(role => role.id === req.query.roleId); // Find role by ID

  if (!selectedRole) {
    return res.redirect('/epsv12/roles'); // Redirect if no role found
  }
// Update all roles: set `selected` to "" for all, then "yes" for the selected one
roles.forEach(role => role.selected = ""); 
selectedRole.selected = "yes"; 

// Save updated roles back to session
req.session.data.roles = roles;
  res.render('./epsv12/roles-confirm', { selectedRole }); // Pass selected role to template
});


router.get('/epsv12/results-none', (req, res) => {
  const initialSearch = req.query.initialSearch; // Get the value from URL query parameters
  res.render('./epsv12/results-none', { initialSearch }); // Pass it to the template
});

//..........................................................................................................
//..PPPPP..................................................rii...................tii........................
//.PPPPPPPPPP..............................................rii.............pttt..tii........................
//.PPPPPPPPPP..............................................rii.............pttt..tii........................
//.PPPPPPPPPPP.............................................rii.............pttt..tii........................
//.PPPP...PPPP.Prrrrr..eeeeee...esssssss...ccccccc..crrrrr.rii.iippppppp..pptttt.tii...ooooooo...onnnnnnnn..
//.PPPP...PPPP.Prrrrr.reeeeeee..esssssss..scccccccc.crrrrr.rii.iipppppppp.pptttt.tii..ioooooooo..onnnnnnnn..
//.PPPPPPPPPPP.Prrrrrrreeeeeeeeeesssssssssscccccccc.crrrrr.rii.iippppppppppptttt.tii.iiooooooooo.onnnnnnnn..
//.PPPPPPPPPPP.Prrr..rree..eeeeeesssssssssscc..cccc.crrr...rii.iippp.ppppp.pttt..tii.iioo...oooo.onnn.nnnn..
//.PPPPPPPPPP..Prr...rreeeeeeee.esssssss.sscc.......crr....rii.iipp...pppp.pttt..tii.iioo...oooo.onn...nnn..
//.PPPPPPPPP...Prr...rreeeeeeee.esssssss.sscc.......crr....rii.iipp...pppp.pttt..tii.iioo...oooo.onn...nnn..
//.PPPP........Prr...rree......eesssssssssscc..cccc.crr....rii.iipp...pppp.pttt..tii.iioo...oooo.onn...nnn..
//.PPPP........Prr...rreeeeeeeeeesss.sssssscccccccc.crr....rii.iippppppppp.pttt..tii.iiooooooooo.onn...nnn..
//.PPPP........Prr...rreeeeeee.eessssssss.sccccccc..crr....rii.iipppppppp..ptttt.tii..ioooooooo..onn...nnn..
//.PPPP........Prr....reeeeeee..esssssss..sccccccc..crr....rii.iipppppppp..ptttt.tii...ooooooo...onn...nnn..
//......................eeee.....ssssss.....cccc...............iipp.ppp......ttt........ooooo...............
//.............................................................iipp.........................................
//.............................................................iipp.........................................
//.............................................................iipp.........................................
//..........................................................................................................


 // Import your data file

 router.get("/epsv12/prescription-template", function (req, res) {
  const prescID = req.query["prescID"] ? req.query["prescID"].trim() : null;
  const prescType = req.query["prescType"] ? req.query["prescType"].trim() : null;

  // Validate inputs
  if (!prescID || !prescType) {
    console.log("Missing prescription ID or type.");
    return res.redirect("/epsv12/search");
  }

  // Retrieve prescriptions from session data
  const prescriptionsArray = req.session.data.prescriptions || [];

  // Find the prescription by ID and type
  const matchedPrescription = prescriptionsArray.find(item => {
    const prescription = item[Object.keys(item)[0]];
    return prescription.prescriptionID === prescID && prescription.prescriptionType === prescType;
  });

  if (!matchedPrescription) {
    console.log("Prescription not found.");
    return res.redirect("/epsv12/search");
  }

  // Extract prescription details for rendering
  const prescription = matchedPrescription[Object.keys(matchedPrescription)[0]];
    // Log the extracted prescription details
    console.log("Prescription Details:", {
      prescriptionID: prescription.prescriptionID,
      prescriptionType: prescription.prescriptionType,
      prescriptionERDsupply: prescription.daysSupply, 
      pendingCancellation: prescription.pendingCancellation,
      prescriptionIssueDate: prescription.prescriptionIssueDate,
      prescriptionStatus: prescription.prescriptionStatus,
      prescriptionDispensed: prescription.itemsDispensed,
      prescriptionPrescribed: prescription.itemsPrescribed,


      prescriptionItems: [
        { exists:prescription.prescriptionItem1exists, nameItem: prescription.prescriptionItem1, initialitem: prescription.prescriptionItem1Initial, quantityItem: prescription.prescriptionItem1quantity, initialQuantity: prescription.prescriptionItem1quantityInitial, pendingCancellationItem: prescription.prescriptionItem1pendingCancelation, cancellationReasonItem:prescription.prescriptionItem1cancellationreason, quantityItem: prescription.prescriptionItem1quantity, instructionItem: prescription.prescriptionItem1instructions, instructionInitial:prescription.prescriptionItem1instructionsInitial, itemstatusItem: prescription.prescriptionItem1Status, NHSAppItem: prescription.prescriptionItem1PrescNHSApp, Prescribed: prescription.prescriptionItem1Prescribed, Dispensed: prescription.prescriptionItem1Dispensed},
        { exists:prescription.prescriptionItem2exists, nameItem: prescription.prescriptionItem2, quantityItem: prescription.prescriptionItem2quantity, pendingCancellationItem: prescription.prescriptionItem2pendingCancelation, cancellationReasonItem:prescription.prescriptionItem2cancellationreason, quantityItem: prescription.prescriptionItem2quantity, instructionItem: prescription.prescriptionItem2instructions, itemstatusItem: prescription.prescriptionItem2Status, NHSAppItem: prescription.prescriptionItem2PrescNHSApp, Prescribed: prescription.prescriptionItem2Prescribed, Dispensed: prescription.prescriptionItem2Dispensed},
        { exists:prescription.prescriptionItem3exists, nameItem: prescription.prescriptionItem3, quantityItem: prescription.prescriptionItem3quantity, pendingCancellationItem: prescription.prescriptionItem3pendingCancelation, cancellationReasonItem:prescription.prescriptionItem3cancellationreason, quantityItem: prescription.prescriptionItem3quantity, instructionItem: prescription.prescriptionItem3instructions, itemstatusItem: prescription.prescriptionItem3Status, NHSAppItem: prescription.prescriptionItem3PrescNHSApp, Prescribed: prescription.prescriptionItem3Prescribed, Dispensed: prescription.prescriptionItem3Dispensed},
        { exists:prescription.prescriptionItem4exists, nameItem: prescription.prescriptionItem4, quantityItem: prescription.prescriptionItem4quantity, pendingCancellationItem: prescription.prescriptionItem4pendingCancelation, cancellationReasonItem:prescription.prescriptionItem4cancellationreason, quantityItem: prescription.prescriptionItem4quantity, instructionItem: prescription.prescriptionItem4instructions, itemstatusItem: prescription.prescriptionItem4Status, NHSAppItem: prescription.prescriptionItem4PrescNHSApp, Prescribed: prescription.prescriptionItem4Prescribed, Dispensed: prescription.prescriptionItem4Dispensed},
      ],
      prescriptionMessage1: prescription.prescriptionMessage1,
      prescriptionMessageHeader1: prescription.prescriptionMessage1header,
      prescriptionMessageDateTime1: prescription.prescriptionMessage1sendDateTime,
      prescriptionLess2: prescription.prescriptionless2,
      prescriptionMessage1Org: prescription.prescriptionMessage1Org,
      PrescriptionNewStatus1: prescription.prescriptionMessage1NewStatus,
      prescriptionDN1: prescription.prescriptionMessage1DN,
      prescriptionDN1id: prescription.prescriptionMessage1DNID,
      prescriptionDN1Items: [
        {item: prescription.prescriptionMessage1DNItem1, quantity:prescription.prescriptionMessage1DNItem1q, instruction: prescription.prescriptionMessage1DNItem1ins, status: prescription.prescriptionMessage1DNStatus1},
        {item: prescription.prescriptionMessage1DNItem2, quantity:prescription.prescriptionMessage1DNItem2q, instruction: prescription.prescriptionMessage1DNItem2ins, status: prescription.prescriptionMessage1DNStatus2},
        {item: prescription.prescriptionMessage1DNItem3, quantity:prescription.prescriptionMessage1DNItem3q, instruction: prescription.prescriptionMessage1DNItem3ins, status: prescription.prescriptionMessage1DNStatus3},
        {item: prescription.prescriptionMessage1DNItem4, quantity:prescription.prescriptionMessage1DNItem4q, instruction: prescription.prescriptionMessage1DNItem4ins, status: prescription.prescriptionMessage1DNStatus4},

      ],
      

      prescriptionMessage2: prescription.prescriptionMessage2,
      prescriptionMessageHeader2: prescription.prescriptionMessage2header,
      prescriptionMessageDateTime2: prescription.prescriptionMessage2sendDateTime,
      prescriptionMessage2Org: prescription.prescriptionMessage2Org,
      prescriptionNewStatus2: prescription.prescriptionMessage2NewStatus,
      prescriptionDN2: prescription.prescriptionMessage2DN,
      prescriptionDN2id: prescription.prescriptionMessage2DNID,
      prescriptionDN2Items: [
        {item: prescription.prescriptionMessage2DNItem1, quantity:prescription.prescriptionMessage2DNItem1q, instruction: prescription.prescriptionMessage2DNItem1ins, status: prescription.prescriptionMessage2DNStatus1},
        {item: prescription.prescriptionMessage2DNItem2, quantity:prescription.prescriptionMessage2DNItem2q, instruction: prescription.prescriptionMessage2DNItem2ins, status: prescription.prescriptionMessage2DNStatus2},
        {item: prescription.prescriptionMessage2DNItem3, quantity:prescription.prescriptionMessage2DNItem3q, instruction: prescription.prescriptionMessage2DNItem3ins, status: prescription.prescriptionMessage2DNStatus3},
        {item: prescription.prescriptionMessage2DNItem4, quantity:prescription.prescriptionMessage2DNItem4q, instruction: prescription.prescriptionMessage2DNItem4ins, status: prescription.prescriptionMessage2DNStatus4},

      ],
    

      prescriptionMessage3: prescription.prescriptionMessage3,
      prescriptionMessageHeader3: prescription.prescriptionMessage3header,
      prescriptionMessageDateTime3: prescription.prescriptionMessage3sendDateTime,
      prescriptionMessage3Org: prescription.prescriptionMessage3Org ,
      prescriptionNewStatus3:prescription.prescriptionMessage3NewStatus, 
      prescriptionDN3: prescription.prescriptionMessage3DN, 
      prescriptionDN3id: prescription.prescriptionMessage3DNID,
      prescriptionDN3Items: [
        {item: prescription.prescriptionMessage3DNItem1, quantity:prescription.prescriptionMessage3DNItem1q, instruction: prescription.prescriptionMessage3DNItem1ins, status: prescription.prescriptionMessage3DNStatus1},
        {item: prescription.prescriptionMessage3DNItem2, quantity:prescription.prescriptionMessage3DNItem2q, instruction: prescription.prescriptionMessage3DNItem2ins, status: prescription.prescriptionMessage3DNStatus2},
        {item: prescription.prescriptionMessage3DNItem3, quantity:prescription.prescriptionMessage3DNItem3q, instruction: prescription.prescriptionMessage3DNItem3ins, status: prescription.prescriptionMessage3DNStatus3},
        {item: prescription.prescriptionMessage3DNItem4, quantity:prescription.prescriptionMessage3DNItem4q, instruction: prescription.prescriptionMessage3DNItem4ins, status: prescription.prescriptionMessage3DNStatus4},

      ],
      prescriptionMessage4: prescription.prescriptionMessage4,
      prescriptionMessageHeader4: prescription.prescriptionMessage4header,
      prescriptionMessageDateTime4: prescription.prescriptionMessage4sendDateTime,
      prescriptionMessage4Org: prescription.prescriptionMessage4Org ,
      prescriptionNewStatus4:prescription.prescriptionMessage4NewStatus,
      prescriptionDN4: prescription.prescriptionMessage4DN, 
      prescriptionDN4id: prescription.prescriptionMessage4DNID,
      prescriptionDN4Items: [
        {item: prescription.prescriptionMessage4DNItem1, quantity:prescription.prescriptionMessage4DNItem1q, instruction: prescription.prescriptionMessage4DNItem1ins, status: prescription.prescriptionMessage4DNStatus1},
        {item: prescription.prescriptionMessage4DNItem2, quantity:prescription.prescriptionMessage4DNItem2q, instruction: prescription.prescriptionMessage4DNItem2ins, status: prescription.prescriptionMessage4DNStatus2},
        {item: prescription.prescriptionMessage4DNItem3, quantity:prescription.prescriptionMessage4DNItem3q, instruction: prescription.prescriptionMessage4DNItem3ins, status: prescription.prescriptionMessage4DNStatus3},
        {item: prescription.prescriptionMessage4DNItem4, quantity:prescription.prescriptionMessage4DNItem4q, instruction: prescription.prescriptionMessage4DNItem4ins, status: prescription.prescriptionMessage4DNStatus4},
  
      ],
      prescriptionMessage5: prescription.prescriptionMessage5,
      prescriptionMessageHeader5: prescription.prescriptionMessage5header,
      prescriptionMessageDateTime5: prescription.prescriptionMessage5sendDateTime,
      prescriptionMessage5Org: prescription.prescriptionMessage5Org ,
      prescriptionNewStatus5:prescription.prescriptionMessage5NewStatus,
      prescriptionDN5: prescription.prescriptionMessage5DN, 
      prescriptionDN5id: prescription.prescriptionMessage5DNID,
      prescriptionDN5Items: [
        {item: prescription.prescriptionMessage5DNItem1, quantity:prescription.prescriptionMessage5DNItem1q, instruction: prescription.prescriptionMessage5DNItem1ins, status: prescription.prescriptionMessage5DNStatus1},
        {item: prescription.prescriptionMessage5DNItem2, quantity:prescription.prescriptionMessage5DNItem2q, instruction: prescription.prescriptionMessage5DNItem2ins, status: prescription.prescriptionMessage5DNStatus2},
        {item: prescription.prescriptionMessage5DNItem3, quantity:prescription.prescriptionMessage5DNItem3q, instruction: prescription.prescriptionMessage5DNItem3ins, status: prescription.prescriptionMessage5DNStatus3},
        {item: prescription.prescriptionMessage5DNItem4, quantity:prescription.prescriptionMessage5DNItem4q, instruction: prescription.prescriptionMessage5DNItem4ins, status: prescription.prescriptionMessage5DNStatus4},
  
      ],
      prescriptionMessage6: prescription.prescriptionMessage6,
      prescriptionMessageHeader6: prescription.prescriptionMessage6header,
      prescriptionMessageDateTime6: prescription.prescriptionMessage6sendDateTime,
      prescriptionMessage6Org: prescription.prescriptionMessage6Org ,
      prescriptionNewStatus6:prescription.prescriptionMessage6NewStatus,
      prescriptionDN6: prescription.prescriptionMessage6DN, 
      prescriptionDN6id: prescription.prescriptionMessage6DNID,
      prescriptionDN6Items: [
        {item: prescription.prescriptionMessage6DNItem1, quantity:prescription.prescriptionMessage6DNItem1q, instruction: prescription.prescriptionMessage6DNItem1ins, status: prescription.prescriptionMessage6DNStatus1},
        {item: prescription.prescriptionMessage6DNItem2, quantity:prescription.prescriptionMessage6DNItem2q, instruction: prescription.prescriptionMessage6DNItem2ins, status: prescription.prescriptionMessage6DNStatus2},
        {item: prescription.prescriptionMessage6DNItem3, quantity:prescription.prescriptionMessage6DNItem3q, instruction: prescription.prescriptionMessage6DNItem3ins, status: prescription.prescriptionMessage6DNStatus3},
        {item: prescription.prescriptionMessage6DNItem4, quantity:prescription.prescriptionMessage6DNItem4q, instruction: prescription.prescriptionMessage6DNItem4ins, status: prescription.prescriptionMessage6DNStatus4},
  
      ],
  
      prescriptionDispenser: prescription.dispenserBox,
      prescriptionDispenseOrg: prescription.Dispenserorg,
      prescriptionDispenserAddress: prescription.Dispenseraddress, 
      prescriptionDispenserContact: prescription.Dispensercontact,
      prescriptionNomDispenser: prescription.nominatedDispenserBox, 
      prescriptionNomDispenserOrg: prescription.nominatedDispenserorg, 
      prescriptionNomDispenserAddress: prescription.nominatedDispenseraddress, 
      prescriptionNomDispeserContact: prescription.nominatedDispensercontact, 
      prescriptionPrescriber: prescription.prescriberBox, 
      prescriptionPrescriberOrg: prescription.prescriberOrg, 
      prescriptionPrescriberAddress: prescription.prescriberAddress, 
      prescriptionPrescriberContact: prescription.prescribercontact, 
      prescriptionPrescriberCountry: prescription.prescriberCountry,
    });

  res.render("./epsv12/prescription-template", {
    prescriptionID: prescription.prescriptionID,
    prescriptionType: prescription.prescriptionType,
    prescriptionERDsupply: prescription.daysSupply, 
    pendingCancellation: prescription.pendingCancellation,
    prescriptionIssueDate: prescription.prescriptionIssueDate,
    prescriptionLess2: prescription.prescriptionless2,
    prescriptionStatus: prescription.prescriptionStatus,
    prescriptionDispensed: prescription.itemsDispensed,
    prescriptionPrescribed: prescription.itemsPrescribed,
    prescriptionItems: [
      { exists:prescription.prescriptionItem1exists, nameItem: prescription.prescriptionItem1, initialitem: prescription.prescriptionItem1Initial, quantityItem: prescription.prescriptionItem1quantity, initialQuantity: prescription.prescriptionItem1quantityInitial, pendingCancellationItem: prescription.prescriptionItem1pendingCancelation, cancellationReasonItem:prescription.prescriptionItem1cancellationreason, quantityItem: prescription.prescriptionItem1quantity, instructionItem: prescription.prescriptionItem1instructions, instructionInitial:prescription.prescriptionItem1instructionsInitial, itemstatusItem: prescription.prescriptionItem1Status, NHSAppItem: prescription.prescriptionItem1PrescNHSApp, Prescribed: prescription.prescriptionItem1Prescribed, Dispensed: prescription.prescriptionItem1Dispensed},
      { exists:prescription.prescriptionItem2exists, nameItem: prescription.prescriptionItem2, quantityItem2: prescription.prescriptionItem2quantity, pendingCancellationItem: prescription.prescriptionItem2pendingCancelation, cancellationReasonItem:prescription.prescriptionItem2cancellationreason, quantityItem: prescription.prescriptionItem2quantity, instructionItem: prescription.prescriptionItem2instructions, itemstatusItem: prescription.prescriptionItem2Status, NHSAppItem: prescription.prescriptionItem2PrescNHSApp, Prescribed: prescription.prescriptionItem2Prescribed, Dispensed: prescription.prescriptionItem2Dispensed},
      { exists:prescription.prescriptionItem3exists, nameItem: prescription.prescriptionItem3, quantityItem: prescription.prescriptionItem3quantity, pendingCancellationItem: prescription.prescriptionItem3pendingCancelation, cancellationReasonItem:prescription.prescriptionItem3cancellationreason, quantityItem: prescription.prescriptionItem3quantity, instructionItem: prescription.prescriptionItem3instructions, itemstatusItem: prescription.prescriptionItem3Status, NHSAppItem: prescription.prescriptionItem3PrescNHSApp, Prescribed: prescription.prescriptionItem3Prescribed, Dispensed: prescription.prescriptionItem3Dispensed},
      { exists:prescription.prescriptionItem4exists, nameItem: prescription.prescriptionItem4, quantityItem: prescription.prescriptionItem4quantity, pendingCancellationItem: prescription.prescriptionItem4pendingCancelation, cancellationReasonItem:prescription.prescriptionItem4cancellationreason, quantityItem: prescription.prescriptionItem4quantity, instructionItem: prescription.prescriptionItem4instructions, itemstatusItem: prescription.prescriptionItem4Status, NHSAppItem: prescription.prescriptionItem4PrescNHSApp, Prescribed: prescription.prescriptionItem4Prescribed, Dispensed: prescription.prescriptionItem4Dispensed},
    ],
    prescriptionMessage1: prescription.prescriptionMessage1,
    prescriptionMessageHeader1: prescription.prescriptionMessage1header,
    prescriptionMessageDateTime1: prescription.prescriptionMessage1sendDateTime,
    prescriptionMessage1Org: prescription.prescriptionMessage1Org,
    prescriptionNewStatus1: prescription.prescriptionMessage1NewStatus,
    prescriptionDN1: prescription.prescriptionMessage1DN,
    prescriptionDN1id: prescription.prescriptionMessage1DNID,
    prescriptionDN1Items: [
      {item: prescription.prescriptionMessage1DNItem1, quantity:prescription.prescriptionMessage1DNItem1q, instruction: prescription.prescriptionMessage1DNItem1ins, status: prescription.prescriptionMessage1DNStatus1},
      {item: prescription.prescriptionMessage1DNItem2, quantity:prescription.prescriptionMessage1DNItem2q, instruction: prescription.prescriptionMessage1DNItem2ins, status: prescription.prescriptionMessage1DNStatus2},
      {item: prescription.prescriptionMessage1DNItem3, quantity:prescription.prescriptionMessage1DNItem3q, instruction: prescription.prescriptionMessage1DNItem3ins, status: prescription.prescriptionMessage1DNStatus3},
      {item: prescription.prescriptionMessage1DNItem4, quantity:prescription.prescriptionMessage1DNItem4q, instruction: prescription.prescriptionMessage1DNItem4ins, status: prescription.prescriptionMessage1DNStatus4},

    ],

    prescriptionMessage2: prescription.prescriptionMessage2,
    prescriptionMessageHeader2: prescription.prescriptionMessage2header,
    prescriptionMessageDateTime2: prescription.prescriptionMessage2sendDateTime,
    prescriptionMessage2Org: prescription.prescriptionMessage2Org,
    prescriptionNewStatus2: prescription.prescriptionMessage2NewStatus,
    prescriptionDN2: prescription.prescriptionMessage2DN,
    prescriptionDN2id: prescription.prescriptionMessage2DNID,
    prescriptionDN2Items: [
      {item: prescription.prescriptionMessage2DNItem1, quantity:prescription.prescriptionMessage2DNItem1q, instruction: prescription.prescriptionMessage2DNItem1ins, status: prescription.prescriptionMessage2DNStatus1},
      {item: prescription.prescriptionMessage2DNItem2, quantity:prescription.prescriptionMessage2DNItem2q, instruction: prescription.prescriptionMessage2DNItem2ins, status: prescription.prescriptionMessage2DNStatus2},
      {item: prescription.prescriptionMessage2DNItem3, quantity:prescription.prescriptionMessage2DNItem3q, instruction: prescription.prescriptionMessage2DNItem3ins, status: prescription.prescriptionMessage2DNStatus3},
      {item: prescription.prescriptionMessage2DNItem4, quantity:prescription.prescriptionMessage2DNItem4q, instruction: prescription.prescriptionMessage2DNItem4ins, status: prescription.prescriptionMessage2DNStatus4},
    ],

    prescriptionMessage3: prescription.prescriptionMessage3,
    prescriptionMessageHeader3: prescription.prescriptionMessage3header,
    prescriptionMessageDateTime3: prescription.prescriptionMessage3sendDateTime,
    prescriptionMessage3Org: prescription.prescriptionMessage3Org ,
    prescriptionNewStatus3:prescription.prescriptionMessage3NewStatus,
    prescriptionDN3: prescription.prescriptionMessage3DN, 
    prescriptionDN3id: prescription.prescriptionMessage3DNID,
    prescriptionDN3Items: [
      {item: prescription.prescriptionMessage3DNItem1, quantity:prescription.prescriptionMessage3DNItem1q, instruction: prescription.prescriptionMessage3DNItem1ins, status: prescription.prescriptionMessage3DNStatus1},
      {item: prescription.prescriptionMessage3DNItem2, quantity:prescription.prescriptionMessage3DNItem2q, instruction: prescription.prescriptionMessage3DNItem2ins, status: prescription.prescriptionMessage3DNStatus2},
      {item: prescription.prescriptionMessage3DNItem3, quantity:prescription.prescriptionMessage3DNItem3q, instruction: prescription.prescriptionMessage3DNItem3ins, status: prescription.prescriptionMessage3DNStatus3},
      {item: prescription.prescriptionMessage3DNItem4, quantity:prescription.prescriptionMessage3DNItem4q, instruction: prescription.prescriptionMessage3DNItem4ins, status: prescription.prescriptionMessage3DNStatus4},

    ],

    prescriptionMessage4: prescription.prescriptionMessage4,
    prescriptionMessageHeader4: prescription.prescriptionMessage4header,
    prescriptionMessageDateTime4: prescription.prescriptionMessage4sendDateTime,
    prescriptionMessage4Org: prescription.prescriptionMessage4Org ,
    prescriptionNewStatus4:prescription.prescriptionMessage4NewStatus,
    prescriptionDN4: prescription.prescriptionMessage4DN, 
    prescriptionDN4id: prescription.prescriptionMessage4DNID,
    prescriptionDN4Items: [
      {item: prescription.prescriptionMessage4DNItem1, quantity:prescription.prescriptionMessage4DNItem1q, instruction: prescription.prescriptionMessage4DNItem1ins, status: prescription.prescriptionMessage4DNStatus1},
      {item: prescription.prescriptionMessage4DNItem2, quantity:prescription.prescriptionMessage4DNItem2q, instruction: prescription.prescriptionMessage4DNItem2ins, status: prescription.prescriptionMessage4DNStatus2},
      {item: prescription.prescriptionMessage4DNItem3, quantity:prescription.prescriptionMessage4DNItem3q, instruction: prescription.prescriptionMessage4DNItem3ins, status: prescription.prescriptionMessage4DNStatus3},
      {item: prescription.prescriptionMessage4DNItem4, quantity:prescription.prescriptionMessage4DNItem4q, instruction: prescription.prescriptionMessage4DNItem4ins, status: prescription.prescriptionMessage4DNStatus4},

    ],

    prescriptionMessage5: prescription.prescriptionMessage5,
    prescriptionMessageHeader5: prescription.prescriptionMessage5header,
    prescriptionMessageDateTime5: prescription.prescriptionMessage5sendDateTime,
    prescriptionMessage5Org: prescription.prescriptionMessage5Org ,
    prescriptionNewStatus5:prescription.prescriptionMessage5NewStatus,
    prescriptionDN5: prescription.prescriptionMessage5DN, 
    prescriptionDN5id: prescription.prescriptionMessage5DNID,
    prescriptionDN5Items: [
      {item: prescription.prescriptionMessage5DNItem1, quantity:prescription.prescriptionMessage5DNItem1q, instruction: prescription.prescriptionMessage5DNItem1ins, status: prescription.prescriptionMessage5DNStatus1},
      {item: prescription.prescriptionMessage5DNItem2, quantity:prescription.prescriptionMessage5DNItem2q, instruction: prescription.prescriptionMessage5DNItem2ins, status: prescription.prescriptionMessage5DNStatus2},
      {item: prescription.prescriptionMessage5DNItem3, quantity:prescription.prescriptionMessage5DNItem3q, instruction: prescription.prescriptionMessage5DNItem3ins, status: prescription.prescriptionMessage5DNStatus3},
      {item: prescription.prescriptionMessage5DNItem4, quantity:prescription.prescriptionMessage5DNItem4q, instruction: prescription.prescriptionMessage5DNItem4ins, status: prescription.prescriptionMessage5DNStatus4},

    ],

    prescriptionMessage6: prescription.prescriptionMessage6,
    prescriptionMessageHeader6: prescription.prescriptionMessage6header,
    prescriptionMessageDateTime6: prescription.prescriptionMessage6sendDateTime,
    prescriptionMessage6Org: prescription.prescriptionMessage6Org ,
    prescriptionNewStatus6:prescription.prescriptionMessage6NewStatus,
    prescriptionDN6: prescription.prescriptionMessage6DN, 
    prescriptionDN6id: prescription.prescriptionMessage6DNID,
    prescriptionDN6Items: [
      {item: prescription.prescriptionMessage6DNItem1, quantity:prescription.prescriptionMessage6DNItem1q, instruction: prescription.prescriptionMessage6DNItem1ins, status: prescription.prescriptionMessage6DNStatus1},
      {item: prescription.prescriptionMessage6DNItem2, quantity:prescription.prescriptionMessage6DNItem2q, instruction: prescription.prescriptionMessage6DNItem2ins, status: prescription.prescriptionMessage6DNStatus2},
      {item: prescription.prescriptionMessage6DNItem3, quantity:prescription.prescriptionMessage6DNItem3q, instruction: prescription.prescriptionMessage6DNItem3ins, status: prescription.prescriptionMessage6DNStatus3},
      {item: prescription.prescriptionMessage6DNItem4, quantity:prescription.prescriptionMessage6DNItem4q, instruction: prescription.prescriptionMessage6DNItem4ins, status: prescription.prescriptionMessage6DNStatus4},

    ],

    prescriptionDispenser: prescription.dispenserBox,
    prescriptionDispenseOrg: prescription.Dispenserorg,
    prescriptionDispenserAddress: prescription.Dispenseraddress, 
    prescriptionDispenserContact: prescription.Dispensercontact,
    prescriptionNomDispenser: prescription.nominatedDispenserBox, 
    prescriptionNomDispenserOrg: prescription.nominatedDispenserorg, 
    prescriptionNomDispenserAddress: prescription.nominatedDispenseraddress, 
    prescriptionNomDispeserContact: prescription.nominatedDispensercontact, 
    prescriptionPrescriber: prescription.prescriberBox, 
    prescriptionPrescriberOrg: prescription.prescriberOrg, 
    prescriptionPrescriberAddress: prescription.prescriberAddress, 
    prescriptionPrescriberContact: prescription.prescribercontact, 
    prescriptionPrescriberCountry: prescription.prescriberCountry,


  });
});
}
