
var async = require('async'),
    fs = require('fs'),
    glob = require('glob');

var departments = JSON.parse(fs.readFileSync('./departments.json')),
    customerTypeToID = {
      "Business": "businesses",
      "Businesses": "businesses",
      "Individuals": "individuals",
      "Citizen": "individuals"
    },
    businessModelToID = {
      "Fees and charges": "fees",
      "Cost recovery": "fees",
      "Service users": "fees",
      "Service user": "fees",
      "Taxpayers": "tax",
      "Department budget": "tax"
    },
    departmentTitleToID = Object.keys(departments).reduce(function(titleToID, id) {
      titleToID[departments[id].title] = id;
      return titleToID;
    }, {});

glob('./dashboards/**/*.json', function(err, files) {
  async.map(files, fs.readFile, function(err, content) {
    var dashboards = content.map(JSON.parse);

    dashboards.forEach(function(dashboard, i) {
      var path = files[i];

      if (dashboard.department) {
        console.log(path + ' department title is "' + dashboard.department.title + '" and id is "' + departmentTitleToID[dashboard.department.title] + '"');
        dashboard.department = departmentTitleToID[dashboard.department.title];
      } else console.log(path + ' doesnt have a department');

      if (dashboard['customer-type']) {
        console.log(path + ' customer type is "' + dashboard['customer-type'] + '" and id is "' + customerTypeToID[dashboard['customer-type']] + '"');
        dashboard['customer-type'] = customerTypeToID[dashboard['customer-type']];
      } else console.log(path + ' doesnt have a customer-type');

      if (dashboard['business-model']) {
        console.log(path + ' business-model is "' + dashboard['business-model'] + '" and id is "' + businessModelToID[dashboard['business-model']] + '"');
        dashboard['business-model'] = businessModelToID[dashboard['business-model']];
      } else console.log(path + ' doesnt have a business-model');

      fs.writeFileSync(path, JSON.stringify(dashboard, null, '  '));
    });
  });
});
