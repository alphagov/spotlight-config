
var async = require('async'),
    fs = require('fs'),
    glob = require('glob');

function toId(obj) {
  var id;
  if (obj.abbr) id = obj.abbr.toLowerCase().replace(/\s/g, '-');
  else id = obj.title.toLowerCase().replace(/\s/g, '-');
  return id;
}

function reduceObjs(m, obj) {
  var id = toId(obj),
      objById = m[id],
      doesntExist;

  if (!objById) objById = m[id] = [];

  doesntExist = objById.filter(function(o) {
    return o.title === obj.title;
  }).length === 0;

  if (doesntExist) objById.push(obj);

  return m;
}

function getMappings(m) {
  return Object.keys(m).reduce(function(mapping, id) {
    m[id].forEach(function(o) {
      mapping[o.title] = id;
    });
    return mapping;
  }, {});
}

var customerTypeMapping = {
      "Business": "businesses",
      "Businesses": "businesses",
      "Individuals": "individuals",
      "Citizen": "individuals"
    },
    businessModelMapping = {
      "Fees and charges": "fees",
      "Cost recovery": "fees",
      "Service users": "fees",
      "Service user": "fees",
      "Taxpayers": "tax",
      "Department budget": "tax"
    };

glob('./dashboards/**/*.json', function(err, files) {
  async.map(files, fs.readFile, function(err, content) {
    var dashboards = content.map(JSON.parse),
        departments = [], agencies = [],
        agencyMapping, departmentMapping;

    dashboards.forEach(function(dashboard) {
      if (dashboard.department) departments.push(dashboard.department);
      if (dashboard.agency) agencies.push(dashboard.agency);
    });

    // reduce the list of depts and agencies down to an id
    // to list of possible objects
    departments = departments.reduce(reduceObjs, { });
    agencies = agencies.reduce(reduceObjs, { });

    // generate mapping of possible titles to ids
    departmentMapping = getMappings(departments);
    agencyMapping = getMappings(agencies);

    // reduce the id to possible objs down to just id -> obj
    departments = Object.keys(departments).reduce(function(m, id) {
      m[id] = departments[id][0];
      return m;
    }, {});
    agencies = Object.keys(agencies).reduce(function(m, id) {
      m[id] = agencies[id][0];
      return m;
    }, {});

    fs.writeFileSync('./departments.json',
        JSON.stringify(departments, null, '  '));
    fs.writeFileSync('./agencies.json',
        JSON.stringify(agencies, null, '  '));

    dashboards.forEach(function(dashboard, i) {
      var path = files[i],
          val;

      if (dashboard.department && (val = departmentMapping[dashboard.department.title])) {
        dashboard.department = val;
      }

      if (dashboard.agency && (val = agencyMapping[dashboard.agency.title])) {
        dashboard.agency = val;
      }

      if (dashboard['customer-type'] && (val = customerTypeMapping[dashboard['customer-type']])) {
        dashboard['customer-type'] = val;
      }

      if (dashboard['business-model'] && (val = businessModelMapping[dashboard['business-model']])) {
        dashboard['business-model'] = val;
      }

      fs.writeFileSync(path, JSON.stringify(dashboard, null, '  '));
    });

  });
});
