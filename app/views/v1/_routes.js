module.exports = (router) => {


// search via nhs number form
router.post("/v1/search-nhs", function (req, res) {
  const nhsNumber = req.body["nhsNumber"];
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

// chnage record via a NHS number on NoK section
router.post("/v1/change-record", function (req, res) {
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


router.post("/v1/switch-layout", function (req, res) {
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

router.get('/v1/patient-details', function (req, res) {
  const target = req.query.tab;
  if (target) {

  } else {

  }
  return res.render('v1/patient-details', {'target': target})
})

}