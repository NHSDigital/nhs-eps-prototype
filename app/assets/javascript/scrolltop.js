jQuery(document).ready(function ($) {
  // Cache frequently used jQuery objects
  let $window = $(window);
  let $document = $(document);
  let $scrollTopBtn = $(".app-scrolltop");
  let $floatingNameDOB = $(".app-floating-name-dob");
  let $header = $(".nhsuk-header");
  let $patientBanner = $(".app-patient-banner");
  let $footer = $("#nhsuk-footer");
  let $raFooterContainer = $(".ra-footer-container");
  let $accordionInner = $(".accordion-inner");
  let $sideNavLinks = $('a.side-nav__section-list__link');
  let $mobileNavSelect = $("#mobile-nav-select");
  let $mobileNav = $("#mobile-nav");
  let $sections = $("section");

  // Calculate the top and the height of relevant elements
  let $headerTop= $header.offset().top;
  let $patientBannerHeight = $patientBanner.outerHeight();
  let $headerHeight = $header.outerHeight() + $patientBanner.outerHeight();
  let $mobileNavTop = $mobileNav.position().top;

  let visible = false;
  let topofDiv = $headerTop
  let height =
    $patientBanner.outerHeight() + $header.outerHeight(); //gets height of header

  //Check to see if the window is top if not then display button

  $(window).scroll(function () {
    if ($(this).scrollTop()) {
      $scrollTopBtn.fadeIn();
    } else {
      $scrollTopBtn.fadeOut();
    }

    if ( $window.scrollTop() + $window.height() < $document.height() - $footer.height() - 92 ) {
      $scrollTopBtn.css({ position: 'fixed', bottom: '20px', right: '16px' });
    }

    if ( $window.scrollTop() + $window.height() > $document.height() - $headerHeight - $(".ra-footer-container").height() - 92) {
      $scrollTopBtn.css({ position: 'relative', bottom: '62px' });
    }

    if ($window.width() > 768) {
      if ($window.scrollTop() > $headerHeight + $patientBannerHeight) {
        $floatingNameDOB.fadeIn();
      } else {
        $floatingNameDOB.fadeOut();
      }
    }
  });

  var a = $(".accordion-inner");
  var apos = a.position();
  if (apos) {
    $(window).scroll(function () {
      var windowpos = $(window).scrollTop();
      if (windowpos + 20 >= apos.top) {
        a.addClass("inner-wrapper-sticky");
        a.addClass("accordion-scroll");
      } else {
        a.removeClass("inner-wrapper-sticky");
        a.removeClass("accordion-scroll");
      }
    });
  }

  // sidebar menu highlighting

  var link = $('a.side-nav__section-list__link');

  // Move to specific section when click on menu link
  link.on('click', function(e) {
    var target = $($(this).attr('href'));
    $('html, body').animate({
      scrollTop: target.offset().top
    }, 600);
    $(this).addClass('active');
    e.preventDefault();
  });

  // Run the scrNav when scroll
  $(window).on('scroll', function(){
    scrNav();
  });

  // scrNav function
  // Change active dot according to the active section in the window
  function scrNav() {
    var sTop = $(window).scrollTop();
    $('section').each(function() {
      var id = $(this).attr('id'),
        offset = $(this).offset().top-1,
        height = $(this).height();
      if(sTop >= offset && sTop < offset + height) {
        link.removeClass('active');
        $('#navbar').find('[data-scroll="' + id + '"]').addClass('active');
      }
    });
  }
  scrNav();


  //Click event to scroll to top

  $(".app-scrolltop").click(function () {
    $("html, body").animate(
      {
        scrollTop: 0,
      },
      1000
    );
  });

  // Mobile navigation

  var IDs = [];
  var headers = [];
  //Push each section ID (to use as a link) and each section title so we can populate select box in mobile nav
  //disable for overview 1 navigation prototype
  $("section").each(function() {
    IDs.push("#" + this.id);
  });
  $("section").each(function() {
    headers.push(this.title);
  });
  //Merge two arrays into one object
  var result = headers.reduce(function (result, field, index) {
    result[IDs[index]] = field;
    return result;
  }, {});
  //Assign each object key and value to the select box
  $.each(result, function (key, value) {
    $("#mobile-nav-select").append(
      $("<option>", {
        value: key,
      }).text(value)
    );
  });
  /*$.each(result, function(key, value) {
    $('.navigation-ul')
      .append($('<li><a class="scra-accordion__link" href=' + key + '>' + value + '</a></li>'));
  });*/

  var s = $mobileNav;
  var pos = $mobileNav.position();
  if (pos) {
    $(window).scroll(function () {
      var windowpos = $(window).scrollTop();
      if (windowpos >= pos.top) {
        s.addClass("nav-stick");
      } else {
        s.removeClass("nav-stick");
      }
    });
  }

  $mobileNavSelect.change(function () {
    var targetPosition = $($(this).val()).offset().top -300;
    $("html,body").animate(
      {
        scrollTop: targetPosition,
      },
      "slow"
    );
  });

  $(".currently-viewing-section").text($("section").first().attr("title"));

  $(document).scroll(function () {
    var cutoff = $(window).scrollTop() + 200;

    $("section").each(function () {
      if ($(this).offset().top + $(this).height() > cutoff) {
        $("#mobile-nav-select").val("#" + $(this).attr("id"));
        $(".currently-viewing-section").text($(this).attr("title"));
        return false; // stops the iteration after the first one on screen
      }
    });
  });
});
