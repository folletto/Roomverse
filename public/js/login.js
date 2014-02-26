/*
 * Login Library
 * This file is part of Roomverse.
 *
 * Copyright (C) 2014 Davide 'Folletto' Casali <folletto AT gmail DOT com>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 ******************************************************************************************
 *
 * Requires
 *   jQuery
 *
 */


var xa; 

$(document).ready(function() {
  
  $("#userid").focus();
  
  // I know, this is awful, but it's just a basic trap to start with.
  $("form").submit(function (e) {
      e.preventDefault();
      
      if (this.userid.value === "") {
        $(this.userid).addClass("invalid");
        alert("Please enter your nickname.");
      } else {
        this.submit();
      }
      
  });

});

