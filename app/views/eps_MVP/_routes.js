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
      return res.redirect("search-results");
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
          return res.redirect("search-results");
      }

      console.log("Patient found:", patient);
      req.session.data.patient = patient;
      return res.redirect(`search-results?nhsNumber=${nhsNumber}`);
  } else {
      console.log("No patient found with that prescription number.");
      req.session.data.patient = null;
      return res.redirect("search-results");
  }
});

  // search via nhs number form
  router.post("/eps_mvp/search-nhs-post", function (req, res) {
    const nhsNumber = req.body["nhsNumber"];
    req.session.data.errors = {};

    // If there is no submitted option
    if (!nhsNumber) {
      req.session.data.errors["nhs-number"] = true;
      return res.redirect("search-results");
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

    res.redirect(`search-results?nhsNumber=${nhsNumber}`);
  });

  

  // search via nhs basic search
  router.post("/eps_mvp/search-basic-post", function (req, res) {
    let searchPostcode = req.body["postcode-only-input"];
    let searchLastName = req.body["surname"];

    let dobDay = ''
    let dobMonth = ''
    let dobYear = ''

    if (req.body['date-of-birth']) {
      dobDay = req.body['date-of-birth-day'] || ''
      dobMonth = req.body['date-of-birth-month'] || ''
      dobYear = req.body['date-of-birth-year'] || ''
    }

    req.session.data.errors = {};

    // Check everything is filled in
    if (!searchPostcode && !searchLastName && !dobDay && !dobMonth && !dobYear) {
      req.session.data.errors["basicSearch"] = true;
      return res.redirect("search-basic");
    }

    req.session.data['results'] = ['9726918863','5900009890','9726919193','9726919207','9726919215'];

    res.redirect(`search-results`);
  });


  // search via nhs advanced search
  router.post("/eps_mvp/submit-search-advanced", function (req, res) {
    let searchGender = req.body["search-gender"];
    let searchLastName = req.body["surname"];
    let searchWiden = req.body["algorithmicSearch"];
    if (searchWiden !== 'true') {
      req.session.data["algorithmicSearch"] = 'false';
    }

    let dobDay = ''
    let dobMonth = ''
    let dobYear = ''

    if (req.body['date-of-birth']) {
      dobDay = req.body['date-of-birth-day'] || ''
      dobMonth = req.body['date-of-birth-month'] || ''
      dobYear = req.body['date-of-birth-year'] || ''
    }

    req.session.data.errors = {};

    // Check everything is filled in
    if (!searchGender && !searchLastName && !dobDay && !dobMonth && !dobYear) {
      req.session.data.errors["basicSearch"] = true;
      return res.redirect("search-advanced");
    }

    req.session.data['results'] = ['9726918863','5900009890','9726919193','9726919207','9726919215'];

    res.redirect(`search-results`);
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

}