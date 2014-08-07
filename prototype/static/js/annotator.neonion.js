Annotator.Plugin.Neonion = function (element, options) {

	var persons = [
		{ label: "Unbekannte Person", uri : "http://neonion.com/resource/Unknown_Person" },
		{ label: "Otto Hahn", uri : "https://www.wikidata.org/wiki/Q57065" },
		{ label: "Max Planck", uri : "https://www.wikidata.org/wiki/Q9021" },
		{ label: "Otto von Baeyer", uri : "https://www.wikidata.org/wiki/Q1682101" },
		{ label: "Wilhelm Westphal", uri : "https://www.wikidata.org/wiki/Q95679" }
	];

	var user;

    return {

		

		pluginInit : function () {
			
			// add field to linked person
			this.annotator.viewer.addField({
				load: function (field, annotation) {
					field.innerHTML = "Person: <a href='" + annotation.rdf.about + "' target='blank'>" + annotation.rdf.label + "</a>";
				}
			});
			// add field with creator
			this.annotator.viewer.addField({
				load: function (field, annotation) {
					var userField = "Unbekannt";
					if (annotation.creator) {
						userField = annotation.creator.email;
					}
					field.innerHTML = "Erfasser: " + userField + "</a>";
				}
			});

			// add field containing the suggested ressources
			var suggestionField = this.annotator.editor.addField({
				load: this.updateSuggestionField,
				submit: this.pluginSubmit
			});
			$(suggestionField).children((":first")).replaceWith("<div class='btn-group-vertical suggestionItems'></div>");
			$(suggestionField).click(function (e) {
				var source = $(e.target);

				source.parent().children().removeClass("active");
				$(source).addClass("active");
				$(".annotator-widget").submit();
			});

			// get logged in user credentials
			$.ajax({
				context : this, 
				type : "get",
				url : options.whoamiUrl, 
				success : this.setUser, 
				dataType : "json"
			});

			// attach event handler to enrich DOM with RDFa
			this.annotator.subscribe("annotationCreated", this.enrichRDFa);
			this.annotator.subscribe("annotationUpdated", this.enrichRDFa);

		},

		setUser : function(userData) { 
			user = userData; 
		},

		enrichRDFa : function(annotation) {
			// add RDFa attributes to markup
			annotation.highlights[0].setAttribute("typeof", annotation.rdf.typeof);
			annotation.highlights[0].setAttribute("property", annotation.rdf.property);
			annotation.highlights[0].setAttribute("about", annotation.rdf.about);
		},

		pluginSubmit : function(field, annotation) {
			var activeItem = $(field).children(":first").children(".active");

			// add user to annotation
			annotation.creator = user;

			// update annotation object
			annotation.rdf = {
				typeof : "dbpedia-owl:Person", // "gndo:DifferentiatedPerson",
				property : "rdfs:label",
				about : activeItem.attr("uri"),
				label : activeItem.text()
			 };
		},

		updateSuggestionField : function(field, annotation) {
			var list = $(field).children(":first");
			var associatedUri = annotation.rdf ? annotation.rdf.about : "";

			list.empty();
			// add items
			$.each(persons, function(index, value) {
				// var css = index == 0 ? "btn-green" : "";
				var css = "";
				list.append("<button type='button' class='annotator-btn " + css + "' uri='" +  value.uri + "'>" + value.label + "</button>");
				if (associatedUri == value.uri) {
					list.children(":last").addClass("active");
				}
			});
		}

	}

};