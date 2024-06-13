jQuery(document).ready(function ($) {

  // Cache frequently used jQuery objects
  let $window = $(window);
  let $document = $(document);
  let $scrollTopBtn = $(".app-scrolltop");
  let $floatingNameDOB = $(".app-floating-name-dob");
  let $header = $(".nhsuk-header");
  let $patientBanner = $(".patient-summary");
  let $footer = $(".nhsuk-footer-container");
  let $raFooterContainer = $(".ra-footer-container");
  let $accordionInner = $(".accordion-inner");
  let $sideNavLinks = $('a.side-nav__section-list__link');
  let $mobileNavSelect = $("#mobile-nav-select");
  var options = [];
  // let $mobileNav = $("#mobile-nav");
  let $sections = $("section");
  let $toc = $('#sidebar-content');
  let $copyButtons = $(".copy-button");
  let $dropdownBtn = $(".dropdown-select");
  let $gpMore = $(".historic-practice-more");
  let $gpMoreBtn = $(".historic-practice-more-button");

  // Calculate the top and the height of relevant elements
  function calculatePositions() {
    return {
      headerTop: $header.offset().top,
      headerHeight: $header.outerHeight() + $patientBanner.outerHeight()
      // mobileNavTop: $mobileNav.position().top
    };
  }

  let positions = calculatePositions();

  // Debounce function to limit the rate at which a function can fire
  function debounce(func, wait, immediate) {
    var timeout;
    return function () {
      var context = this, args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  // Function to handle scroll with debouncing
  let handleScroll = debounce(function () {
    let scrollTop = $window.scrollTop();
    let scrollBottom = scrollTop + $window.height();
    let docHeight = $document.height();

    // Sticky or relative positioning for scroll to top button
    if (scrollBottom < docHeight - $footer.height() - 40 && scrollTop !== 0) {
      $scrollTopBtn.css({position: 'fixed', bottom: '20px', right: '16px'});
    } else {
      $scrollTopBtn.css({position: 'relative', bottom: '60px', right: '0'});
    }

    // Floating name DOB visibility
    let shouldShowFloatingNameDOB = $window.width() > 990 && scrollTop > positions.headerTop + positions.headerHeight;
    if (shouldShowFloatingNameDOB) {
      $floatingNameDOB.fadeIn();
    } else {
      $floatingNameDOB.fadeOut();
    }
  }, 100); // Debounce interval of 100 milliseconds

  $window.on('scroll resize', function () {
    positions = calculatePositions(); // Recalculate positions on resize
    handleScroll();
  });
  handleScroll(); // Initial call

  // Click event to scroll to top
  $scrollTopBtn.on('click', function () {
    $("html, body").animate({scrollTop: 0}, 1000);
  });

  // Click event open and close the jump menu
  $dropdownBtn.on('click', function () {
    $(".dropdown-select__dropdown").toggle();
  });

  // Click event for historic GP details
  $('.historic-practice-more').hide();

  // Click event handler for 'View more'/'View less' buttons
  $('.historic-practice-more-button').click(function() {
    // Find all subsequent elements with the class 'historic-practice-more' after the clicked button
    var moreRows = $(this).closest('.nhsuk-table__row').nextAll('.historic-practice-more');

    // Toggle the visibility of all found 'historic-practice-more' rows
    moreRows.toggle();

    // Change the text of the button based on its current text
    $(this).text(function(_, text) {
      return text === 'View less' ? 'View more' : 'View less';
    });
  });

  // Select all elements with the class .data-field__content--address
  $('.data-field__content--address').each(function() {
    // Get the current content of the element
    var content = $(this).html();
    // Replace all commas with line breaks
    content = content.replace(/,/g, '<br>');
    // Update the element's content
    $(this).html(content);
  });


  const sections = $('.data-section');

  // Dynamically build the sidebar menu and dropdown menu
  sections.each(function() {
    const $section = $(this);
    const $heading = $section.find('h2');
    const $2colheading = $section.attr('title');
    const $subheadings = $section.find('.nhsuk-card__heading>span');

    if ($heading.length || $2colheading.length) {
      $('<h3 class="sidebar__subheading">' + $heading.text() + '</h3>').appendTo('#sidebar-content');
      $('<p class="dropdown-select__dropdown-item dropdown-select__dropdown-item--header">' + $heading.text() + '</p>').appendTo('#dropdown-content');
      $('<li class="nhsuk-sub-navigation__item"><a type="button" aria-current="false" class="nhsuk-sub-navigation__link" tabindex="0">' + $2colheading + '</a></li>')
        .appendTo('#subnav').attr('data-target', '#' + $section.children('[id]').attr('id'))
        .click(function() {
          // Hide all sections
          sections.each(function() {
            $(this).hide();
          });
          // Remove active class from all items if present
          $('.nhsuk-sub-navigation__item a').attr('aria-current', 'false');
          // Set aria-current to "page"
          $(this).find('a').attr('aria-current', 'page');
          // Show the target section
          let targetId = $(this).attr('data-target');
          console.log(targetId)
          $(targetId).parents().show();
        });
    }

    $subheadings.each(function() {
      const $subheading = $(this);

      $('<button class="dropdown-select__dropdown-item" type="button"><span class="nhsuk-u-visually-hidden">Skip to </span>' + $subheading.text() + '<span class="nhsuk-u-visually-hidden"> within Key demographic information</span></button>')
        .attr('data-target', '#' + $subheading.closest('[id]').attr('id'))
        .appendTo('#dropdown-content')
        .click(function() {
          $('html, body').animate({
            scrollTop: $($(this).data('target')).offset().top -40
          }, 400);
        });


      $('<button class="sidebar__button" type="button">' + $subheading.text() + '</button>')
        .attr('data-target', '#' + $subheading.closest('[id]').attr('id'))
        .appendTo('#sidebar-content')
        .click(function() {
          $('html, body').animate({
            scrollTop: $($(this).data('target')).offset().top -40
          }, 400);
        });

    });

  });

  $('.sidebar__button:first').addClass('sidebar__button--active');


  // highlight and display first section
  $('.nhsuk-sub-navigation__link:first').attr('aria-current', 'page');


  // Highlight active menu items based on scroll position
  const $menuItems = $('.sidebar__button');
  $(window).on('scroll', function() {
    let currentSection;
    let $subsections = $('.nhsuk-card');

    $subsections.each(function() {
      const sectionTop = $(this).offset().top;
      if (scrollY >= sectionTop - 300) {
        currentSection = this;
      }
    });

    const currentId = $(currentSection).attr('id');
    $menuItems.removeClass('sidebar__button--active');
    $menuItems.filter(function() {
      return $(this).data('target') === '#' + currentId;
    }).addClass('sidebar__button--active');
  });

  // copy to pasteboard

  $copyButtons.each(function () {
    $(this).on('click', function () {
      let copyText = $('#copyText').text(); // Ensure it's the value you want to copy
      console.log(copyText);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(copyText.replaceAll(/\s/g,''))
          .then(() => {
            console.log('Text copied to clipboard successfully!' + copyText);
          })
          .catch(err => {
            console.error('Failed to copy text: ', err);
          });
      } else {
        console.error('Clipboard API not available');
      }
    });
  });

});

// modal window
(function() {

  'use strict'

  // list out the vars
  var mOverlay = getId('modal_window'),
    mOpen = getId('modal_open'),
    mCreate = getId('modal_create'),
    mClose = getId('modal_close'),
    modal = getId('modal_holder'),
    emailField = getId('emailAddress'),
    allNodes = document.querySelectorAll("*"),
    modalOpen = false,
    lastFocus,
    i

  // wrap all this and check the modal is on the page first
  if (mOverlay !== null) {
    // Let's open the modal
    function modalShow ( event ) {
      event.preventDefault ? event.preventDefault() : event.returnValue = false
      lastFocus = document.activeElement
      mOverlay.setAttribute('aria-hidden', 'false')
      modalOpen = true
      modal.setAttribute('tabindex', '0')
      modal.forms[0].elements[0].focus()
      modal.focus()
      mOverlay.scrollTop(0)
      emailField.focus()
    }

    // binds to both the button click and the escape key to close the modal window
    // but only if modalOpen is set to true
    function modalClose ( event ) {
      if (modalOpen && ( !event.keyCode || event.keyCode === 27 ) ) {
        mOverlay.setAttribute('aria-hidden', 'true')
        modal.setAttribute('tabindex', '-1')
        event.preventDefault()
        modalOpen = false
        lastFocus.focus()
      }
    }

    // Restrict focus to the modal window when it's open.
    // Tabbing will just loop through the whole modal.
    // Shift + Tab will allow backup to the top of the modal,
    // and then stop.
    function focusRestrict ( event ) {
      if (modalOpen && !modal.contains( event.target ) ) {
        event.stopPropagation()
        modal.focus()
      }
    }

    // Close modal window by clicking on the overlay
    mOverlay.addEventListener('click', function( e ) {
      if (e.target == modal.parentNode) {
        modalClose( e )
      }
    }, false)

    // open modal by btn click/hit
    // mOpen.addEventListener('click', modalShow)
    mCreate.addEventListener('click', modalShow, false)
    // close modal by btn click/hit
    mClose.addEventListener('click', modalClose)

    // close modal by keydown, but only if modal is open
    document.addEventListener('keydown', modalClose)

    // restrict tab focus on elements only inside modal window
    for (i = 0; i < allNodes.length; i++) {
      allNodes.item(i).addEventListener('focus', focusRestrict)
    }
  }

  // Let's cut down on what we need to type to get an ID
  function getId ( id ) {
    return document.getElementById(id)
  }
})()