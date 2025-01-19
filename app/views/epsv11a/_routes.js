module.exports = (router) => {

  router.get('/epsv11a/search', function (req, res) {
    // check for clear
    let refine = req.query.refine || 'false';
    let lastSearch = req.session.data["last-search"];
    let target = 'epsv11a/search';
    if (lastSearch === 'basic') {
      target = 'epsv11a/search-basic';
    } else if (lastSearch === 'advanced') {
      target = 'epsv11a/search-advanced';
    } else {
      target = 'epsv11a/search';
    }

    return res.render(target, {
      'refine': refine
    })
  })

  //search via presc number
// search via presc number form
// Redirect via spinner after prescription search
router.post("/epsv11a/search-presc-post", function (req, res) {
  const prescNumber = req.body["prescNumber"];
  req.session.data.errors = {};

  if (!prescNumber) {
    req.session.data.errors["presc-number"] = true;
    return res.redirect("search");
  }

  let patientEntry = req.session.data.patients.find(p => 
    Object.values(p).some(patient => patient.prescriptionNo.includes(prescNumber))
  );

  let patient = patientEntry ? Object.values(patientEntry).find(patient => patient.prescriptionNo.includes(prescNumber)) : null;

  if (patient) {
    const nhsNumber = patient.nhsNumber;

    if (!nhsNumber) {
      req.session.data.patient = null;
      return res.redirect("search");
    }

    req.session.data.patient = patient;
    req.session.data.prescriptionID = prescNumber;

    // Redirect to the spinner
    return res.redirect(`spinner-prescription-list?nhsNumber=${nhsNumber}&prescID=${prescNumber}`);
  } else {
    req.session.data.patient = null;
    return res.redirect("search");
  }
});

// Redirect via spinner after NHS number search
router.post("/epsv11a/search-nhs-post", function (req, res) {
  const nhsNumber = req.body["nhsNumber"].replace(/\s/g, '');
  req.session.data.errors = {};

  if (!nhsNumber) {
    req.session.data.errors["nhs-number"] = true;
    return res.redirect("search-nhs");
  }

  let patientEntry = req.session.data.patients.find(p => p[nhsNumber]);
  let patient = patientEntry ? patientEntry[nhsNumber] : null;

  if (patient) {
    req.session.data.patient = patient;

    // Redirect to the spinner
    return res.redirect(`spinner-prescription-list?nhsNumber=${nhsNumber}`);
  } else {
    req.session.data.patient = null;
    req.session.data.errors["nhs-number"] = true;
    return res.redirect("search-nhs");
  }
});




  // search via nhs basic search
  router.post("/epsv11a/search-basic-post", function (req, res) {
    let patients = req.session.data['patients'] || {}; // Ensure patients is defined

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
        return res.redirect('spinner-prescription-list?nhsNumber=5900009890');
    }
});



// change record via a NHS number on NoK section
  router.post("/epsv11a/change-record", function (req, res) {
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


  router.post("/epsv11a/switch-layout", function (req, res) {
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

  router.get('/epsv11a/patient-details', function (req, res) {
    const target = req.query.tab;
    if (target) {

    } else {

    }
    return res.render('epsv11a/patient-details', {'target': target})
  })

  // switcher routing

  router.post('/epsv11a/switch', function (req, res) {
    // grab the bit of the url we need to se the redirect to the same page
    var url = req.get('Referrer') .split( '/' );
    res.redirect('/epsv11a/' + url[4] )
  })
 
  
 // Search results page
router.get("/epsv11a/search-results", function (req, res, next) {
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
  res.render('./epsv11a/search-results', {
      returnedPatientsList: returnedPatientsList,
      nhsNumbers: nhsNumbers // Renamed for clarity
  });
});

  //prescription search results page
  router.get("/epsv11a/prescription-results", function (req, res, next) {
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
      return prescription.prescriptionStatus === 'Future issue date' || prescription.prescriptionStatus === 'Future repeat dispense';
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
    res.render('./epsv11a/prescription-results', {
      returnedPrescriptionsListAll: returnedPrescriptionsListAll,
      returnedPrescriptionsListCurrent: returnedPrescriptionsListCurrent,
      returnedPrescriptionsListFuture: returnedPrescriptionsListFuture,
      returnedPrescriptionsListExpired: returnedPrescriptionsListExpired,
      returnedPatientFirstName: returnedPatientFirstName,
      returnedPatientLastName: returnedPatientLastName
  });
  });

 // Import your data file

 router.get("/epsv11a/prescription-template", function (req, res) {
  const prescID = req.query["prescID"] ? req.query["prescID"].trim() : null;
  const prescType = req.query["prescType"] ? req.query["prescType"].trim() : null;

  // Validate inputs
  if (!prescID || !prescType) {
    console.log("Missing prescription ID or type.");
    return res.redirect("/epsv11a/search");
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
    return res.redirect("/epsv11a/search");
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
        { exists:prescription.prescriptionItem1exists, nameItem: prescription.prescriptionItem1, quantityItem: prescription.prescriptionItem1quantity, pendingCancellationItem: prescription.prescriptionItem1pendingCancelation, cancellationReasonItem:prescription.prescriptionItem1cancellationreason, quantityItem: prescription.prescriptionItem1quantity, instructionItem: prescription.prescriptionItem1instructions, itemstatusItem: prescription.prescriptionItem1Status, NHSAppItem: prescription.prescriptionItem1PrescNHSApp, Prescribed: prescription.prescriptionItem1Prescribed, Dispensed: prescription.prescriptionItem1Dispensed},
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
        {item: prescription.prescriptionMessage1DNItem1, quantity:prescription.prescriptionMessage1DNItem1q},
        {item: prescription.prescriptionMessage1DNItem2, quantity:prescription.prescriptionMessage1DNItem2q},
        {item: prescription.prescriptionMessage1DNItem3, quantity:prescription.prescriptionMessage1DNItem3q},
        {item: prescription.prescriptionMessage1DNItem4, quantity:prescription.prescriptionMessage1DNItem4q},

      ],
      

      prescriptionMessage2: prescription.prescriptionMessage2,
      prescriptionMessageHeader2: prescription.prescriptionMessage2header,
      prescriptionMessageDateTime2: prescription.prescriptionMessage2sendDateTime,
      prescriptionMessage2Org: prescription.prescriptionMessage2Org,
      prescriptionNewStatus2: prescription.prescriptionMessage2NewStatus,
      prescriptionDN2: prescription.prescriptionMessage2DN,
      prescriptionDN2id: prescription.prescriptionMessage2DNID,
      prescriptionDN2Items: [
        {item: prescription.prescriptionMessage2DNItem1, quantity:prescription.prescriptionMessage2DNItem1q},
        {item: prescription.prescriptionMessage2DNItem2, quantity:prescription.prescriptionMessage2DNItem2q},
        {item: prescription.prescriptionMessage2DNItem3, quantity:prescription.prescriptionMessage2DNItem3q},
        {item: prescription.prescriptionMessage2DNItem4, quantity:prescription.prescriptionMessage2DNItem4q},

      ],
    

      prescriptionMessage3: prescription.prescriptionMessage3,
      prescriptionMessageHeader3: prescription.prescriptionMessage3header,
      prescriptionMessageDateTime3: prescription.prescriptionMessage3sendDateTime,
      prescriptionMessage3Org: prescription.prescriptionMessage3Org ,
      prescriptionNewStatus3:prescription.prescriptionMessage3NewStatus, 
      prescriptionDN3: prescription.prescriptionMessage3DN, 
      prescriptionDN3id: prescription.prescriptionMessage3DNID,
      prescriptionDN3Items: [
        {item: prescription.prescriptionMessage3DNItem1, quantity:prescription.prescriptionMessage3DNItem1q},
        {item: prescription.prescriptionMessage3DNItem2, quantity:prescription.prescriptionMessage3DNItem2q},
        {item: prescription.prescriptionMessage3DNItem3, quantity:prescription.prescriptionMessage3DNItem3q},
        {item: prescription.prescriptionMessage3DNItem4, quantity:prescription.prescriptionMessage3DNItem4q},

      ],
      prescriptionMessage4: prescription.prescriptionMessage4,
      prescriptionMessageHeader4: prescription.prescriptionMessage4header,
      prescriptionMessageDateTime4: prescription.prescriptionMessage4sendDateTime,
      prescriptionMessage4Org: prescription.prescriptionMessage4Org ,
      prescriptionNewStatus4:prescription.prescriptionMessage4NewStatus,
      prescriptionDN4: prescription.prescriptionMessage4DN, 
      prescriptionDN4id: prescription.prescriptionMessage4DNID,
      prescriptionDN4Items: [
        {item: prescription.prescriptionMessage4DNItem1, quantity:prescription.prescriptionMessage4DNItem1q},
        {item: prescription.prescriptionMessage4DNItem2, quantity:prescription.prescriptionMessage4DNItem2q},
        {item: prescription.prescriptionMessage4DNItem3, quantity:prescription.prescriptionMessage4DNItem3q},
        {item: prescription.prescriptionMessage4DNItem4, quantity:prescription.prescriptionMessage4DNItem4q},
  
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

  res.render("./epsv11a/prescription-template", {
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
      { exists:prescription.prescriptionItem1exists, nameItem: prescription.prescriptionItem1, quantityItem1: prescription.prescriptionItem1quantity, pendingCancellationItem: prescription.prescriptionItem1pendingCancelation, cancellationReasonItem:prescription.prescriptionItem1cancellationreason, quantityItem: prescription.prescriptionItem1quantity, instructionItem: prescription.prescriptionItem1instructions, itemstatusItem: prescription.prescriptionItem1Status, NHSAppItem: prescription.prescriptionItem1PrescNHSApp, Prescribed: prescription.prescriptionItem1Prescribed, Dispensed: prescription.prescriptionItem1Dispensed},
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
      {item: prescription.prescriptionMessage1DNItem1, quantity:prescription.prescriptionMessage1DNItem1q},
      {item: prescription.prescriptionMessage1DNItem2, quantity:prescription.prescriptionMessage1DNItem2q},
      {item: prescription.prescriptionMessage1DNItem3, quantity:prescription.prescriptionMessage1DNItem3q},
      {item: prescription.prescriptionMessage1DNItem4, quantity:prescription.prescriptionMessage1DNItem4q},

    ],

    prescriptionMessage2: prescription.prescriptionMessage2,
    prescriptionMessageHeader2: prescription.prescriptionMessage2header,
    prescriptionMessageDateTime2: prescription.prescriptionMessage2sendDateTime,
    prescriptionMessage2Org: prescription.prescriptionMessage2Org,
    prescriptionNewStatus2: prescription.prescriptionMessage2NewStatus,
    prescriptionDN2: prescription.prescriptionMessage2DN,
    prescriptionDN2id: prescription.prescriptionMessage2DNID,
    prescriptionDN2Items: [
      {item: prescription.prescriptionMessage2DNItem1, quantity:prescription.prescriptionMessage2DNItem1q},
      {item: prescription.prescriptionMessage2DNItem2, quantity:prescription.prescriptionMessage2DNItem2q},
      {item: prescription.prescriptionMessage2DNItem3, quantity:prescription.prescriptionMessage2DNItem3q},
      {item: prescription.prescriptionMessage2DNItem4, quantity:prescription.prescriptionMessage2DNItem4q},
    ],

    prescriptionMessage3: prescription.prescriptionMessage3,
    prescriptionMessageHeader3: prescription.prescriptionMessage3header,
    prescriptionMessageDateTime3: prescription.prescriptionMessage3sendDateTime,
    prescriptionMessage3Org: prescription.prescriptionMessage3Org ,
    prescriptionNewStatus3:prescription.prescriptionMessage3NewStatus,
    prescriptionDN3: prescription.prescriptionMessage3DN, 
    prescriptionDN3id: prescription.prescriptionMessage3DNID,
    prescriptionDN3Items: [
      {item: prescription.prescriptionMessage3DNItem1, quantity:prescription.prescriptionMessage3DNItem1q},
      {item: prescription.prescriptionMessage3DNItem2, quantity:prescription.prescriptionMessage3DNItem2q},
      {item: prescription.prescriptionMessage3DNItem3, quantity:prescription.prescriptionMessage3DNItem3q},
      {item: prescription.prescriptionMessage3DNItem4, quantity:prescription.prescriptionMessage3DNItem4q},

    ],

    prescriptionMessage4: prescription.prescriptionMessage4,
    prescriptionMessageHeader4: prescription.prescriptionMessage4header,
    prescriptionMessageDateTime4: prescription.prescriptionMessage4sendDateTime,
    prescriptionMessage4Org: prescription.prescriptionMessage4Org ,
    prescriptionNewStatus4:prescription.prescriptionMessage4NewStatus,
    prescriptionDN4: prescription.prescriptionMessage4DN, 
    prescriptionDN4id: prescription.prescriptionMessage4DNID,
    prescriptionDN4Items: [
      {item: prescription.prescriptionMessage4DNItem1, quantity:prescription.prescriptionMessage4DNItem1q},
      {item: prescription.prescriptionMessage4DNItem2, quantity:prescription.prescriptionMessage4DNItem2q},
      {item: prescription.prescriptionMessage4DNItem3, quantity:prescription.prescriptionMessage4DNItem3q},
      {item: prescription.prescriptionMessage4DNItem4, quantity:prescription.prescriptionMessage4DNItem4q},

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

//template 2
router.get("/epsv11a/prescription-template-2", function (req, res) {
  const prescID = req.query["prescID"] ? req.query["prescID"].trim() : null;
  const prescType = req.query["prescType"] ? req.query["prescType"].trim() : null;

  // Validate inputs
  if (!prescID || !prescType) {
    console.log("Missing prescription ID or type.");
    return res.redirect("/epsv11a/search");
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
    return res.redirect("/epsv11a/search");
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
        { exists:prescription.prescriptionItem1exists, nameItem: prescription.prescriptionItem1, quantityItem: prescription.prescriptionItem1quantity, pendingCancellationItem: prescription.prescriptionItem1pendingCancelation, cancellationReasonItem:prescription.prescriptionItem1cancellationreason, quantityItem: prescription.prescriptionItem1quantity, instructionItem: prescription.prescriptionItem1instructions, itemstatusItem: prescription.prescriptionItem1Status, NHSAppItem: prescription.prescriptionItem1PrescNHSApp, Prescribed: prescription.prescriptionItem1Prescribed, Dispensed: prescription.prescriptionItem1Dispensed},
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
        {item: prescription.prescriptionMessage1DNItem1, quantity:prescription.prescriptionMessage1DNItem1q},
        {item: prescription.prescriptionMessage1DNItem2, quantity:prescription.prescriptionMessage1DNItem2q},
        {item: prescription.prescriptionMessage1DNItem3, quantity:prescription.prescriptionMessage1DNItem3q},
        {item: prescription.prescriptionMessage1DNItem4, quantity:prescription.prescriptionMessage1DNItem4q},

      ],
      

      prescriptionMessage2: prescription.prescriptionMessage2,
      prescriptionMessageHeader2: prescription.prescriptionMessage2header,
      prescriptionMessageDateTime2: prescription.prescriptionMessage2sendDateTime,
      prescriptionMessage2Org: prescription.prescriptionMessage2Org,
      prescriptionNewStatus2: prescription.prescriptionMessage2NewStatus,
      prescriptionDN2: prescription.prescriptionMessage2DN,
      prescriptionDN2id: prescription.prescriptionMessage2DNID,
      prescriptionDN2Items: [
        {item: prescription.prescriptionMessage2DNItem1, quantity:prescription.prescriptionMessage2DNItem1q},
        {item: prescription.prescriptionMessage2DNItem2, quantity:prescription.prescriptionMessage2DNItem2q},
        {item: prescription.prescriptionMessage2DNItem3, quantity:prescription.prescriptionMessage2DNItem3q},
        {item: prescription.prescriptionMessage2DNItem4, quantity:prescription.prescriptionMessage2DNItem4q},

      ],
    

      prescriptionMessage3: prescription.prescriptionMessage3,
      prescriptionMessageHeader3: prescription.prescriptionMessage3header,
      prescriptionMessageDateTime3: prescription.prescriptionMessage3sendDateTime,
      prescriptionMessage3Org: prescription.prescriptionMessage3Org ,
      prescriptionNewStatus3:prescription.prescriptionMessage3NewStatus, 
      prescriptionDN3: prescription.prescriptionMessage3DN, 
      prescriptionDN3id: prescription.prescriptionMessage3DNID,
      prescriptionDN3Items: [
        {item: prescription.prescriptionMessage3DNItem1, quantity:prescription.prescriptionMessage3DNItem1q},
        {item: prescription.prescriptionMessage3DNItem2, quantity:prescription.prescriptionMessage3DNItem2q},
        {item: prescription.prescriptionMessage3DNItem3, quantity:prescription.prescriptionMessage3DNItem3q},
        {item: prescription.prescriptionMessage3DNItem4, quantity:prescription.prescriptionMessage3DNItem4q},

      ],
      prescriptionMessage4: prescription.prescriptionMessage4,
      prescriptionMessageHeader4: prescription.prescriptionMessage4header,
      prescriptionMessageDateTime4: prescription.prescriptionMessage4sendDateTime,
      prescriptionMessage4Org: prescription.prescriptionMessage4Org ,
      prescriptionNewStatus4:prescription.prescriptionMessage4NewStatus,
      prescriptionDN4: prescription.prescriptionMessage4DN, 
      prescriptionDN4id: prescription.prescriptionMessage4DNID,
      prescriptionDN4Items: [
        {item: prescription.prescriptionMessage4DNItem1, quantity:prescription.prescriptionMessage4DNItem1q},
        {item: prescription.prescriptionMessage4DNItem2, quantity:prescription.prescriptionMessage4DNItem2q},
        {item: prescription.prescriptionMessage4DNItem3, quantity:prescription.prescriptionMessage4DNItem3q},
        {item: prescription.prescriptionMessage4DNItem4, quantity:prescription.prescriptionMessage4DNItem4q},
  
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

  res.render("./epsv11a/prescription-template-2", {
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
      { exists:prescription.prescriptionItem1exists, nameItem: prescription.prescriptionItem1, quantityItem1: prescription.prescriptionItem1quantity, pendingCancellationItem: prescription.prescriptionItem1pendingCancelation, cancellationReasonItem:prescription.prescriptionItem1cancellationreason, quantityItem: prescription.prescriptionItem1quantity, instructionItem: prescription.prescriptionItem1instructions, itemstatusItem: prescription.prescriptionItem1Status, NHSAppItem: prescription.prescriptionItem1PrescNHSApp, Prescribed: prescription.prescriptionItem1Prescribed, Dispensed: prescription.prescriptionItem1Dispensed},
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
      {item: prescription.prescriptionMessage1DNItem1, quantity:prescription.prescriptionMessage1DNItem1q},
      {item: prescription.prescriptionMessage1DNItem2, quantity:prescription.prescriptionMessage1DNItem2q},
      {item: prescription.prescriptionMessage1DNItem3, quantity:prescription.prescriptionMessage1DNItem3q},
      {item: prescription.prescriptionMessage1DNItem4, quantity:prescription.prescriptionMessage1DNItem4q},

    ],

    prescriptionMessage2: prescription.prescriptionMessage2,
    prescriptionMessageHeader2: prescription.prescriptionMessage2header,
    prescriptionMessageDateTime2: prescription.prescriptionMessage2sendDateTime,
    prescriptionMessage2Org: prescription.prescriptionMessage2Org,
    prescriptionNewStatus2: prescription.prescriptionMessage2NewStatus,
    prescriptionDN2: prescription.prescriptionMessage2DN,
    prescriptionDN2id: prescription.prescriptionMessage2DNID,
    prescriptionDN2Items: [
      {item: prescription.prescriptionMessage2DNItem1, quantity:prescription.prescriptionMessage2DNItem1q},
      {item: prescription.prescriptionMessage2DNItem2, quantity:prescription.prescriptionMessage2DNItem2q},
      {item: prescription.prescriptionMessage2DNItem3, quantity:prescription.prescriptionMessage2DNItem3q},
      {item: prescription.prescriptionMessage2DNItem4, quantity:prescription.prescriptionMessage2DNItem4q},
    ],

    prescriptionMessage3: prescription.prescriptionMessage3,
    prescriptionMessageHeader3: prescription.prescriptionMessage3header,
    prescriptionMessageDateTime3: prescription.prescriptionMessage3sendDateTime,
    prescriptionMessage3Org: prescription.prescriptionMessage3Org ,
    prescriptionNewStatus3:prescription.prescriptionMessage3NewStatus,
    prescriptionDN3: prescription.prescriptionMessage3DN, 
    prescriptionDN3id: prescription.prescriptionMessage3DNID,
    prescriptionDN3Items: [
      {item: prescription.prescriptionMessage3DNItem1, quantity:prescription.prescriptionMessage3DNItem1q},
      {item: prescription.prescriptionMessage3DNItem2, quantity:prescription.prescriptionMessage3DNItem2q},
      {item: prescription.prescriptionMessage3DNItem3, quantity:prescription.prescriptionMessage3DNItem3q},
      {item: prescription.prescriptionMessage3DNItem4, quantity:prescription.prescriptionMessage3DNItem4q},

    ],

    prescriptionMessage4: prescription.prescriptionMessage4,
    prescriptionMessageHeader4: prescription.prescriptionMessage4header,
    prescriptionMessageDateTime4: prescription.prescriptionMessage4sendDateTime,
    prescriptionMessage4Org: prescription.prescriptionMessage4Org ,
    prescriptionNewStatus4:prescription.prescriptionMessage4NewStatus,
    prescriptionDN4: prescription.prescriptionMessage4DN, 
    prescriptionDN4id: prescription.prescriptionMessage4DNID,
    prescriptionDN4Items: [
      {item: prescription.prescriptionMessage4DNItem1, quantity:prescription.prescriptionMessage4DNItem1q},
      {item: prescription.prescriptionMessage4DNItem2, quantity:prescription.prescriptionMessage4DNItem2q},
      {item: prescription.prescriptionMessage4DNItem3, quantity:prescription.prescriptionMessage4DNItem3q},
      {item: prescription.prescriptionMessage4DNItem4, quantity:prescription.prescriptionMessage4DNItem4q},

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
//template 2
router.get("/epsv11a/prescription-template-2-info", function (req, res) {
  const prescID = req.query["prescID"] ? req.query["prescID"].trim() : null;
  const prescType = req.query["prescType"] ? req.query["prescType"].trim() : null;

  // Validate inputs
  if (!prescID || !prescType) {
    console.log("Missing prescription ID or type.");
    return res.redirect("/epsv11a/search");
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
    return res.redirect("/epsv11a/search");
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
        { exists:prescription.prescriptionItem1exists, nameItem: prescription.prescriptionItem1, quantityItem: prescription.prescriptionItem1quantity, pendingCancellationItem: prescription.prescriptionItem1pendingCancelation, cancellationReasonItem:prescription.prescriptionItem1cancellationreason, quantityItem: prescription.prescriptionItem1quantity, instructionItem: prescription.prescriptionItem1instructions, itemstatusItem: prescription.prescriptionItem1Status, NHSAppItem: prescription.prescriptionItem1PrescNHSApp, Prescribed: prescription.prescriptionItem1Prescribed, Dispensed: prescription.prescriptionItem1Dispensed},
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
        {item: prescription.prescriptionMessage1DNItem1, quantity:prescription.prescriptionMessage1DNItem1q},
        {item: prescription.prescriptionMessage1DNItem2, quantity:prescription.prescriptionMessage1DNItem2q},
        {item: prescription.prescriptionMessage1DNItem3, quantity:prescription.prescriptionMessage1DNItem3q},
        {item: prescription.prescriptionMessage1DNItem4, quantity:prescription.prescriptionMessage1DNItem4q},

      ],
      

      prescriptionMessage2: prescription.prescriptionMessage2,
      prescriptionMessageHeader2: prescription.prescriptionMessage2header,
      prescriptionMessageDateTime2: prescription.prescriptionMessage2sendDateTime,
      prescriptionMessage2Org: prescription.prescriptionMessage2Org,
      prescriptionNewStatus2: prescription.prescriptionMessage2NewStatus,
      prescriptionDN2: prescription.prescriptionMessage2DN,
      prescriptionDN2id: prescription.prescriptionMessage2DNID,
      prescriptionDN2Items: [
        {item: prescription.prescriptionMessage2DNItem1, quantity:prescription.prescriptionMessage2DNItem1q},
        {item: prescription.prescriptionMessage2DNItem2, quantity:prescription.prescriptionMessage2DNItem2q},
        {item: prescription.prescriptionMessage2DNItem3, quantity:prescription.prescriptionMessage2DNItem3q},
        {item: prescription.prescriptionMessage2DNItem4, quantity:prescription.prescriptionMessage2DNItem4q},

      ],
    

      prescriptionMessage3: prescription.prescriptionMessage3,
      prescriptionMessageHeader3: prescription.prescriptionMessage3header,
      prescriptionMessageDateTime3: prescription.prescriptionMessage3sendDateTime,
      prescriptionMessage3Org: prescription.prescriptionMessage3Org ,
      prescriptionNewStatus3:prescription.prescriptionMessage3NewStatus, 
      prescriptionDN3: prescription.prescriptionMessage3DN, 
      prescriptionDN3id: prescription.prescriptionMessage3DNID,
      prescriptionDN3Items: [
        {item: prescription.prescriptionMessage3DNItem1, quantity:prescription.prescriptionMessage3DNItem1q},
        {item: prescription.prescriptionMessage3DNItem2, quantity:prescription.prescriptionMessage3DNItem2q},
        {item: prescription.prescriptionMessage3DNItem3, quantity:prescription.prescriptionMessage3DNItem3q},
        {item: prescription.prescriptionMessage3DNItem4, quantity:prescription.prescriptionMessage3DNItem4q},

      ],
      prescriptionMessage4: prescription.prescriptionMessage4,
      prescriptionMessageHeader4: prescription.prescriptionMessage4header,
      prescriptionMessageDateTime4: prescription.prescriptionMessage4sendDateTime,
      prescriptionMessage4Org: prescription.prescriptionMessage4Org ,
      prescriptionNewStatus4:prescription.prescriptionMessage4NewStatus,
      prescriptionDN4: prescription.prescriptionMessage4DN, 
      prescriptionDN4id: prescription.prescriptionMessage4DNID,
      prescriptionDN4Items: [
        {item: prescription.prescriptionMessage4DNItem1, quantity:prescription.prescriptionMessage4DNItem1q},
        {item: prescription.prescriptionMessage4DNItem2, quantity:prescription.prescriptionMessage4DNItem2q},
        {item: prescription.prescriptionMessage4DNItem3, quantity:prescription.prescriptionMessage4DNItem3q},
        {item: prescription.prescriptionMessage4DNItem4, quantity:prescription.prescriptionMessage4DNItem4q},
  
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

  res.render("./epsv11a/prescription-template-2-info", {
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
      { exists:prescription.prescriptionItem1exists, nameItem: prescription.prescriptionItem1, quantityItem1: prescription.prescriptionItem1quantity, pendingCancellationItem: prescription.prescriptionItem1pendingCancelation, cancellationReasonItem:prescription.prescriptionItem1cancellationreason, quantityItem: prescription.prescriptionItem1quantity, instructionItem: prescription.prescriptionItem1instructions, itemstatusItem: prescription.prescriptionItem1Status, NHSAppItem: prescription.prescriptionItem1PrescNHSApp, Prescribed: prescription.prescriptionItem1Prescribed, Dispensed: prescription.prescriptionItem1Dispensed},
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
      {item: prescription.prescriptionMessage1DNItem1, quantity:prescription.prescriptionMessage1DNItem1q},
      {item: prescription.prescriptionMessage1DNItem2, quantity:prescription.prescriptionMessage1DNItem2q},
      {item: prescription.prescriptionMessage1DNItem3, quantity:prescription.prescriptionMessage1DNItem3q},
      {item: prescription.prescriptionMessage1DNItem4, quantity:prescription.prescriptionMessage1DNItem4q},

    ],

    prescriptionMessage2: prescription.prescriptionMessage2,
    prescriptionMessageHeader2: prescription.prescriptionMessage2header,
    prescriptionMessageDateTime2: prescription.prescriptionMessage2sendDateTime,
    prescriptionMessage2Org: prescription.prescriptionMessage2Org,
    prescriptionNewStatus2: prescription.prescriptionMessage2NewStatus,
    prescriptionDN2: prescription.prescriptionMessage2DN,
    prescriptionDN2id: prescription.prescriptionMessage2DNID,
    prescriptionDN2Items: [
      {item: prescription.prescriptionMessage2DNItem1, quantity:prescription.prescriptionMessage2DNItem1q},
      {item: prescription.prescriptionMessage2DNItem2, quantity:prescription.prescriptionMessage2DNItem2q},
      {item: prescription.prescriptionMessage2DNItem3, quantity:prescription.prescriptionMessage2DNItem3q},
      {item: prescription.prescriptionMessage2DNItem4, quantity:prescription.prescriptionMessage2DNItem4q},
    ],

    prescriptionMessage3: prescription.prescriptionMessage3,
    prescriptionMessageHeader3: prescription.prescriptionMessage3header,
    prescriptionMessageDateTime3: prescription.prescriptionMessage3sendDateTime,
    prescriptionMessage3Org: prescription.prescriptionMessage3Org ,
    prescriptionNewStatus3:prescription.prescriptionMessage3NewStatus,
    prescriptionDN3: prescription.prescriptionMessage3DN, 
    prescriptionDN3id: prescription.prescriptionMessage3DNID,
    prescriptionDN3Items: [
      {item: prescription.prescriptionMessage3DNItem1, quantity:prescription.prescriptionMessage3DNItem1q},
      {item: prescription.prescriptionMessage3DNItem2, quantity:prescription.prescriptionMessage3DNItem2q},
      {item: prescription.prescriptionMessage3DNItem3, quantity:prescription.prescriptionMessage3DNItem3q},
      {item: prescription.prescriptionMessage3DNItem4, quantity:prescription.prescriptionMessage3DNItem4q},

    ],

    prescriptionMessage4: prescription.prescriptionMessage4,
    prescriptionMessageHeader4: prescription.prescriptionMessage4header,
    prescriptionMessageDateTime4: prescription.prescriptionMessage4sendDateTime,
    prescriptionMessage4Org: prescription.prescriptionMessage4Org ,
    prescriptionNewStatus4:prescription.prescriptionMessage4NewStatus,
    prescriptionDN4: prescription.prescriptionMessage4DN, 
    prescriptionDN4id: prescription.prescriptionMessage4DNID,
    prescriptionDN4Items: [
      {item: prescription.prescriptionMessage4DNItem1, quantity:prescription.prescriptionMessage4DNItem1q},
      {item: prescription.prescriptionMessage4DNItem2, quantity:prescription.prescriptionMessage4DNItem2q},
      {item: prescription.prescriptionMessage4DNItem3, quantity:prescription.prescriptionMessage4DNItem3q},
      {item: prescription.prescriptionMessage4DNItem4, quantity:prescription.prescriptionMessage4DNItem4q},

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

//template 2
router.get("/epsv11a/prescription-template-2-history", function (req, res) {
  const prescID = req.query["prescID"] ? req.query["prescID"].trim() : null;
  const prescType = req.query["prescType"] ? req.query["prescType"].trim() : null;

  // Validate inputs
  if (!prescID || !prescType) {
    console.log("Missing prescription ID or type.");
    return res.redirect("/epsv11a/search");
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
    return res.redirect("/epsv11a/search");
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
        { exists:prescription.prescriptionItem1exists, nameItem: prescription.prescriptionItem1, quantityItem: prescription.prescriptionItem1quantity, pendingCancellationItem: prescription.prescriptionItem1pendingCancelation, cancellationReasonItem:prescription.prescriptionItem1cancellationreason, quantityItem: prescription.prescriptionItem1quantity, instructionItem: prescription.prescriptionItem1instructions, itemstatusItem: prescription.prescriptionItem1Status, NHSAppItem: prescription.prescriptionItem1PrescNHSApp, Prescribed: prescription.prescriptionItem1Prescribed, Dispensed: prescription.prescriptionItem1Dispensed},
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
        {item: prescription.prescriptionMessage1DNItem1, quantity:prescription.prescriptionMessage1DNItem1q},
        {item: prescription.prescriptionMessage1DNItem2, quantity:prescription.prescriptionMessage1DNItem2q},
        {item: prescription.prescriptionMessage1DNItem3, quantity:prescription.prescriptionMessage1DNItem3q},
        {item: prescription.prescriptionMessage1DNItem4, quantity:prescription.prescriptionMessage1DNItem4q},

      ],
      

      prescriptionMessage2: prescription.prescriptionMessage2,
      prescriptionMessageHeader2: prescription.prescriptionMessage2header,
      prescriptionMessageDateTime2: prescription.prescriptionMessage2sendDateTime,
      prescriptionMessage2Org: prescription.prescriptionMessage2Org,
      prescriptionNewStatus2: prescription.prescriptionMessage2NewStatus,
      prescriptionDN2: prescription.prescriptionMessage2DN,
      prescriptionDN2id: prescription.prescriptionMessage2DNID,
      prescriptionDN2Items: [
        {item: prescription.prescriptionMessage2DNItem1, quantity:prescription.prescriptionMessage2DNItem1q},
        {item: prescription.prescriptionMessage2DNItem2, quantity:prescription.prescriptionMessage2DNItem2q},
        {item: prescription.prescriptionMessage2DNItem3, quantity:prescription.prescriptionMessage2DNItem3q},
        {item: prescription.prescriptionMessage2DNItem4, quantity:prescription.prescriptionMessage2DNItem4q},

      ],
    

      prescriptionMessage3: prescription.prescriptionMessage3,
      prescriptionMessageHeader3: prescription.prescriptionMessage3header,
      prescriptionMessageDateTime3: prescription.prescriptionMessage3sendDateTime,
      prescriptionMessage3Org: prescription.prescriptionMessage3Org ,
      prescriptionNewStatus3:prescription.prescriptionMessage3NewStatus, 
      prescriptionDN3: prescription.prescriptionMessage3DN, 
      prescriptionDN3id: prescription.prescriptionMessage3DNID,
      prescriptionDN3Items: [
        {item: prescription.prescriptionMessage3DNItem1, quantity:prescription.prescriptionMessage3DNItem1q},
        {item: prescription.prescriptionMessage3DNItem2, quantity:prescription.prescriptionMessage3DNItem2q},
        {item: prescription.prescriptionMessage3DNItem3, quantity:prescription.prescriptionMessage3DNItem3q},
        {item: prescription.prescriptionMessage3DNItem4, quantity:prescription.prescriptionMessage3DNItem4q},

      ],
      prescriptionMessage4: prescription.prescriptionMessage4,
      prescriptionMessageHeader4: prescription.prescriptionMessage4header,
      prescriptionMessageDateTime4: prescription.prescriptionMessage4sendDateTime,
      prescriptionMessage4Org: prescription.prescriptionMessage4Org ,
      prescriptionNewStatus4:prescription.prescriptionMessage4NewStatus,
      prescriptionDN4: prescription.prescriptionMessage4DN, 
      prescriptionDN4id: prescription.prescriptionMessage4DNID,
      prescriptionDN4Items: [
        {item: prescription.prescriptionMessage4DNItem1, quantity:prescription.prescriptionMessage4DNItem1q},
        {item: prescription.prescriptionMessage4DNItem2, quantity:prescription.prescriptionMessage4DNItem2q},
        {item: prescription.prescriptionMessage4DNItem3, quantity:prescription.prescriptionMessage4DNItem3q},
        {item: prescription.prescriptionMessage4DNItem4, quantity:prescription.prescriptionMessage4DNItem4q},
  
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

  res.render("./epsv11a/prescription-template-2-history", {
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
      { exists:prescription.prescriptionItem1exists, nameItem: prescription.prescriptionItem1, quantityItem1: prescription.prescriptionItem1quantity, pendingCancellationItem: prescription.prescriptionItem1pendingCancelation, cancellationReasonItem:prescription.prescriptionItem1cancellationreason, quantityItem: prescription.prescriptionItem1quantity, instructionItem: prescription.prescriptionItem1instructions, itemstatusItem: prescription.prescriptionItem1Status, NHSAppItem: prescription.prescriptionItem1PrescNHSApp, Prescribed: prescription.prescriptionItem1Prescribed, Dispensed: prescription.prescriptionItem1Dispensed},
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
      {item: prescription.prescriptionMessage1DNItem1, quantity:prescription.prescriptionMessage1DNItem1q},
      {item: prescription.prescriptionMessage1DNItem2, quantity:prescription.prescriptionMessage1DNItem2q},
      {item: prescription.prescriptionMessage1DNItem3, quantity:prescription.prescriptionMessage1DNItem3q},
      {item: prescription.prescriptionMessage1DNItem4, quantity:prescription.prescriptionMessage1DNItem4q},

    ],

    prescriptionMessage2: prescription.prescriptionMessage2,
    prescriptionMessageHeader2: prescription.prescriptionMessage2header,
    prescriptionMessageDateTime2: prescription.prescriptionMessage2sendDateTime,
    prescriptionMessage2Org: prescription.prescriptionMessage2Org,
    prescriptionNewStatus2: prescription.prescriptionMessage2NewStatus,
    prescriptionDN2: prescription.prescriptionMessage2DN,
    prescriptionDN2id: prescription.prescriptionMessage2DNID,
    prescriptionDN2Items: [
      {item: prescription.prescriptionMessage2DNItem1, quantity:prescription.prescriptionMessage2DNItem1q},
      {item: prescription.prescriptionMessage2DNItem2, quantity:prescription.prescriptionMessage2DNItem2q},
      {item: prescription.prescriptionMessage2DNItem3, quantity:prescription.prescriptionMessage2DNItem3q},
      {item: prescription.prescriptionMessage2DNItem4, quantity:prescription.prescriptionMessage2DNItem4q},
    ],

    prescriptionMessage3: prescription.prescriptionMessage3,
    prescriptionMessageHeader3: prescription.prescriptionMessage3header,
    prescriptionMessageDateTime3: prescription.prescriptionMessage3sendDateTime,
    prescriptionMessage3Org: prescription.prescriptionMessage3Org ,
    prescriptionNewStatus3:prescription.prescriptionMessage3NewStatus,
    prescriptionDN3: prescription.prescriptionMessage3DN, 
    prescriptionDN3id: prescription.prescriptionMessage3DNID,
    prescriptionDN3Items: [
      {item: prescription.prescriptionMessage3DNItem1, quantity:prescription.prescriptionMessage3DNItem1q},
      {item: prescription.prescriptionMessage3DNItem2, quantity:prescription.prescriptionMessage3DNItem2q},
      {item: prescription.prescriptionMessage3DNItem3, quantity:prescription.prescriptionMessage3DNItem3q},
      {item: prescription.prescriptionMessage3DNItem4, quantity:prescription.prescriptionMessage3DNItem4q},

    ],

    prescriptionMessage4: prescription.prescriptionMessage4,
    prescriptionMessageHeader4: prescription.prescriptionMessage4header,
    prescriptionMessageDateTime4: prescription.prescriptionMessage4sendDateTime,
    prescriptionMessage4Org: prescription.prescriptionMessage4Org ,
    prescriptionNewStatus4:prescription.prescriptionMessage4NewStatus,
    prescriptionDN4: prescription.prescriptionMessage4DN, 
    prescriptionDN4id: prescription.prescriptionMessage4DNID,
    prescriptionDN4Items: [
      {item: prescription.prescriptionMessage4DNItem1, quantity:prescription.prescriptionMessage4DNItem1q},
      {item: prescription.prescriptionMessage4DNItem2, quantity:prescription.prescriptionMessage4DNItem2q},
      {item: prescription.prescriptionMessage4DNItem3, quantity:prescription.prescriptionMessage4DNItem3q},
      {item: prescription.prescriptionMessage4DNItem4, quantity:prescription.prescriptionMessage4DNItem4q},

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