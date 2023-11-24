
Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};

function range(size, startAt = 0) {
    return [...Array(size).keys()].map(i => i + startAt);
}

main_table = new Array(100).fill(null);

function populate_chart(ast, chart)
{
    if (!ast) {
        chart.data.labels = [] // range(max_int - min_int, min_int);
        chart.data.datasets = [{'label': 'Missing value', 'data': []}];
        chart.update();
        return;
    }
    var d = [];
    for (var i = 0; i < 10000; i++) {
        d.push(ast.eval());
    }
    var min_int = Math.floor(d.min());
    var max_int = Math.ceil(d.max()) + 1;
    var l = new Array(max_int - min_int).fill(0);
    for (var i = 0; i < d.length; i++) {
        l[Math.floor(d[i]) - min_int]++;
    }
    chart.data.labels = range(max_int - min_int, min_int);
    chart.data.datasets = [{'label': 'Value', 'data': l}];
    chart.update();
}

function start_document()
{
    var table = $("#main-table");
    var first_row = $("<tr></tr>");
    first_row.append($("<td></td>"));
    for (var i = 0; i < 10; i++) {
        first_row.append($("<td>" + String.fromCharCode("A".charCodeAt(0) + i) + "</td>"));
    }
    table.append(first_row)
    for (var j = 0; j < 10; j++) {
        var el = $("<tr></tr>");
        el.append($("<td>" + (j + 1) + "</td>"));
        for (var i = 0; i < 10; i++) {
            var new_el = $("<td><input type='text' size=10></input></td>");
            new_el.find("input").attr("index_x", i);
            new_el.find("input").attr("index_y", j);
            /*if (i == 3 && j == 3) {
                glob_el = new_el;
                new_el.find("input").val("13+-2");
            }*/
       /*     new_el.popover({
                'trigger': 'hover',
                'title': 'distribution',
                'content': 'content'
            });*/
            new_el.hover(function (el) {
                var index_x = parseFloat($(el.target).attr("index_x"));
                var index_y = parseFloat($(el.target).attr("index_y"));
                var e = main_table[index_x * 10 + index_y];
                populate_chart(e, chart);
            }, function (el) {});
            new_el.find("input").on("change", function (el) {
                var index_x = parseFloat($(el.target).attr("index_x"));
                var index_y = parseFloat($(el.target).attr("index_y"));
                var e = parse(el.target.value);
                main_table[index_x * 10 + index_y] = e;
                populate_chart(e, chart);                
            });
            el.append(new_el);
        }
        table.append(el);
    }

    var ctx = document.getElementById("chart");
    chart = new Chart(ctx, {
        'type': 'bar',
        'label': 'value',
        'data': {
            'labels': range(0),
            'datasets': [{'data': [1, 2, 3]}],
        }
    });
    
    /*$(function () {
       $('[data-toggle="popover"]').popover()
    });*/
}