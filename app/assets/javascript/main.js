// ES6 or Vanilla JavaScript



function clickToggle (){

  if ($('input.toggle').is(":checked")) {
    $.post( "/more/manage-notifications", { notifications: "on" } );
  } else {
    $.post( "/more/manage-notifications", { notifications: "off" } );
  }

}

function cookieToggle (){

  if ($('input.toggle').is(":checked")) {
    $.post( "/more/manage-cookies", { cookies: "on" } );
  } else {
    $.post( "/more/manage-cookies", { cookies: "off" } );
  }

}

function passwordToggle (){

  // input
  // where to post
  // true value
  // false value

  if ($('input.toggle').is(":checked")) {

    if (confirm('Turn on Touch ID for "NHS App"' )) {
      $.post( "/more/touch-id", { touchID: "on" } );
    } else {
      window.location.replace("/more/touch-id");
    }

  } else {
    $.post( "/more/touch-id", { touchID: "off" } );
  }

}
