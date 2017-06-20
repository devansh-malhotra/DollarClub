var importedRepositories = new Set();
var packageMap = new Object();
var packageList = [];

// Function to return repositories found for text entered in search bar
function search(s)
{
		var data={
      		'message' : s.value,
      		'published':false,
      	};
		var url='https://api.github.com/search/repositories?q='+s.value;
		$.ajax({
            url: url,
            type:"GET",
            data: JSON.stringify(data),
            contentType:"application/json",
            success: function(data) {
                console.log(data['items']);

                document.getElementById('packageSearch').style.display = "none";
                document.getElementById('pkgSearchBtn').style.display = "none";

                var status = document.getElementById('myDiv');
                status.innerHTML = "Search Results";
                status.style.color = "red";

                var body = document.getElementsByTagName('body')[0];
                body.removeChild(body.lastChild); // Remove last created search result

                var mainBody = document.createElement('div');

                var tbl = document.createElement('table');
                tbl.style.width = '100%';
                tbl.setAttribute('border', '1');

                // Creating bar chart axis
                var x = new Array(10);
                var y = new Array(10);

                // Creting table header
                var header = tbl.createTHead();
                var hrow = header.insertRow(0);
                var hcell1 = hrow.insertCell(0);
                hcell1.innerHTML = "<b>Repository Name</b>";
                var hcell2 = hrow.insertCell(1);
                hcell2.innerHTML = "<b>Fork Count</b>";
                var hcell3 = hrow.insertCell(2);
                hcell3.innerHTML = "<b>Star Count</b>";
                var hcell4 = hrow.insertCell(3);
                hcell4.innerHTML = "<b>Import packages from this repository</b>";

                // Generating table rows
                var tbdy = document.createElement('tbody');

                console.log(importedRepositories);

                for(var i=0;i<data['items'].length;i++)
                {
                    var tr = document.createElement('tr');
                    var repName = data['items'][i].full_name;

                    // If repository has already been imported, mark it as red
                    if(importedRepositories.has(repName))
                        tr.style.color = "red";
                    else
                        tr.style.color = "black";

                    var td1 = document.createElement('td');
                    td1.appendChild(document.createTextNode(repName));
                    var td2 = document.createElement('td');
                    td2.appendChild(document.createTextNode(data['items'][i].forks_count));
                    var td3 = document.createElement('td');
                    td3.appendChild(document.createTextNode(data['items'][i].stargazers_count));
                    var td4 = document.createElement('td');

                    // Get the contents url to check if repository contains "package.json" file
                    var contents_url = data['items'][i].contents_url;

                    // Creating axis list for bar chart. Only top 10 repositories from search are added
                    if(i < 10)
                    {
                        x[i] = data['items'][i].full_name;
                        y[i] = data['items'][i].stargazers_count;
                    }

                    var btn = document.createElement("input");
                    btn.type = "button";
                    btn.value = "Import";
                    btn.onclick = (function(contents_url,repName) {
                        return function () {
                            clickImport(contents_url, repName);
                        }
                    })(contents_url,repName);

                    td4.appendChild(btn);
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    tr.appendChild(td3);
                    tr.appendChild(td4);

                    tbdy.appendChild(tr);
                }
                tbl.appendChild(tbdy);
                mainBody.appendChild(tbl);

                // Creating the bar graph
                var data = [
                    {
                        x: x,
                        y: y,
                        type: 'bar'
                    }
                ];

                var graph = document.createElement("div");
                Plotly.newPlot(graph, data);
                graph.setAttribute("align","center");

                var graphTitle = document.createElement('div');
                graphTitle.innerHTML = "Star Count Bar chart of Top 10 Repositories";
                graphTitle.style.textDecoration = "underline overline";

                mainBody.appendChild(graph);
                mainBody.appendChild(document.createElement('br'));
                mainBody.appendChild(graphTitle);
                body.appendChild(mainBody);
            },
            error: function(data, e1, e2) {
                alert(" message error")
            }
	})
}

// Function to get the packages after "Import" button is clicked
function clickImport(url, repName)
{
    importedRepositories.add(repName); // Add the selected repository to list of imported repositories

    // Selecting "status" div to update the status
    var status = document.getElementById('myDiv');
    status.style.color = "red";

	url=url.substring(0,url.length-7);
    console.log("clicked with url: " + url);

	$.ajax({
		url: url,
		type:"GET",
		contentType:"application/json",
		success: function(data) {
		    console.log(data);
            var size = data.length;
            var flag = false;
            for (var i = 0; i < size; i++) {
                if (data[i].name === "package.json") {
                    flag = true;
                    getDependencies(data[i].download_url);
                    status.innerHTML = "Package Imported Successfully !!"
                }
            }
            if (!flag)
            {
                status.innerHTML = "This project does not contain a valid package.json file !!";
                console.log("This project does not contain a valid package.json file");
            }
			/*else
				console.log("Packages tracked");*/
		},
		error: function(data, e1, e2) {
		console.log(" message error")
		}
	})
}

// Function to get the packages used in the repository
function getDependencies(url)
{
	$.ajax({
		url: url,
		type:"GET",
		success: function(data) {
            var jsonData = JSON.parse(data);
            console.log(jsonData);
            // Adding Dependencies to the list
            addToMap(jsonData.dependencies);
            addToMap(jsonData.devDependencies);
            console.log(packageMap);
		},
		error: function(data, e1, e2) {
		console.log(" message error")
		}
	})
}

// Function to add packages to package map
function addToMap(dependencies)
{
    if(typeof dependencies !== "undefined")
    {
        console.log(dependencies);
        for(var name in dependencies)
        {
            if(name in packageMap) {
                packageMap[name] = packageMap[name] + 1; // Incrementing count of package if it already exists in the map
            }
            else{
                packageMap[name] = 1;
                packageList.push(name); // Adding new package to the list used for auto-complete functionality
            }
        }
    }
}

// Function to get the top 10 packages
function getTopPackages()
{
    var searchBar = document.getElementById('packageSearch');
    searchBar.style.display = "inline";
    searchBar.value = "";
    searchBar.placeholder = "Enter package name";

    document.getElementById('pkgSearchBtn').style.display = "inline";

    document.getElementById('myDiv').innerHTML = "Top 10 Packages";

    var body = document.getElementsByTagName('body')[0];
    body.removeChild(body.lastChild); // Remove last created search result/top package result

    // Sorting the results of the map that stores the Package names and their counts in order to get top results
    var sortable = [];
    console.log(packageMap);
    for (var package in packageMap) {
        sortable.push([package, packageMap[package]]);
    }
    // Changing the comparator to get most frequent results instead of least frequent
    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });
    console.log(sortable);

    // Adding top package results to a table
    var mainBody = document.createElement('div');
    var tbl = document.createElement('table');
    tbl.style.width = '100%';
    tbl.setAttribute('border', '1');

    // Creting table header
    var header = tbl.createTHead();
    var hrow = header.insertRow(0);
    var hcell1 = hrow.insertCell(0);
    hcell1.innerHTML = "<b>Serial No.</b>";
    var hcell2 = hrow.insertCell(1);
    hcell2.innerHTML = "<b>Package Name</b>";
    var hcell3 = hrow.insertCell(2);
    hcell3.innerHTML = "<b>Count</b>";

    // Generating table rows
    var tbdy = document.createElement('tbody');
    for(var cnt=1;cnt<=10;cnt++)
    {
        var tr = document.createElement('tr');
        var td1 = document.createElement('td');
        td1.appendChild(document.createTextNode(cnt));
        var td2 = document.createElement('td');
        td2.appendChild(document.createTextNode(sortable[cnt][0]));
        var td3 = document.createElement('td');
        td3.appendChild(document.createTextNode(sortable[cnt][1]));

        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);

        tbdy.appendChild(tr);
    }
    tbl.appendChild(tbdy);
    mainBody.appendChild(tbl);

    body.appendChild(mainBody);
}

// Auto-complete functionality for "Package Search" search box
$(function() {
    $( "#packageSearch" )
        .autocomplete({
            source: function(request, response) {
                var results = $.ui.autocomplete.filter(packageList, request.term);
                response(results.slice(0, 3));
            },
            messages: {
                noResults:"",
            }
    });
} );

// Function to search package
function searchPackage(p)
{
    document.getElementById('myDiv').innerHTML = "";

    var body = document.getElementsByTagName('body')[0];
    body.removeChild(body.lastChild); // Remove last created search result

    var searchResult = document.createElement('div');
    searchResult.innerHTML = " You searched for " + p.value + " package !";

    body.appendChild(searchResult);
}