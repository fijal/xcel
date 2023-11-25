function check_regex(v, index, r)
{
    if (r.flags != 'y')
        throw new Error("Must specift y as a flag for regex");
    r.lastIndex = index;
    return r.exec(v);
}

function Token(type, v, value, value2)
{
    this.type = type;
    this.v = v;
    this.value = value;
    this.value2 = value2;
}

function tokenize(v) 
{
    i = 0;
    var m;
    var tokens = [];
    while (i < v.length){
        m = check_regex(v, i, /([1-9][0-9]*)\+-([1-9][0-9]*)/y)
        if (m) {
            tokens.push(new Token("range", m[0], parseFloat(m[1]), parseFloat(m[2])));
            i += m[0].length;
            continue;
        }
        m = check_regex(v, i, /[0-9]*\.[0-9]*/y);
        if (!m) {
            m = check_regex(v, i, /[1-9][0-9]*/y);
        }
        if (m) {
            tokens.push(new Token("number", m[0], parseFloat(m[0])));
            i += m[0].length;
            continue;
        }
        m = check_regex(v, i, /\+/y);
        if (m) {
            tokens.push(new Token("binop", m[0], "+"));
            i++;
            continue;
        }
        m = check_regex(v, i, /\-/y);
        if (m) {
            tokens.push(new Token("binop", m[0], "-"));
            i++;
            continue;
        }
        m = check_regex(v, i, /\//y);
        if (m) {
            tokens.push(new Token("binop", m[0], "/"));
            i++;
            continue;
        }
        m = check_regex(v, i, /\*/y);
        if (m) {
            tokens.push(new Token("binop", m[0], "*"));
            i++;
            continue;
        }
        m = check_regex(v, i, /\(/y);
        if (m)
        {
            tokens.push(new Token("left_paren", m[0]));
            i++;
            continue;
        }
        m = check_regex(v, i, /\)/y);
        if (m)
        {
            tokens.push(new Token("right_paren", m[0]));
            i++;
            continue;
        }
        m = check_regex(v, i, /\$([A-Z])([0-9]+)/y)
        if (m) {
            tokens.push(new Token("reference", m[0], m[1], m[2]));
            i += m[0].length;
            continue;
        }
        m = check_regex(v, i, /\s+/y);
        if (m) {
            // ignore whitespaces
            i += m[0].length;
            continue;
        }
        throw new Error("Unrecognized sequence: " + v + " at position " + (i + 1));
    }
    return tokens;
}

function gaussianRandom(mean=0, stdev=1) {
    let u = 1 - Math.random(); //Converting [0,1) to (0,1)
    let v = Math.random();
    let z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}

function Range(base, variance)
{
    this.base = base;
    this.variance = variance;

    this.eval = function (context) {
        return gaussianRandom(this.base, this.variance);
    }
}

function Value(v)
{
    this.v = v;

    this.eval = function (context) {
        return this.v;
    }
}

function Reference(ref_x, ref_y)
{
    this.ref_x = ref_x;
    this.ref_y = ref_y;

    this.eval = function (context) {
        index = this.ref_x * 10 + this.ref_y;
        cached_value = context.cells[index];
        if (cached_value === undefined) {
            cached_value = main_table[index].eval(context);
            context.cells[index] = cached_value;
        }
        return cached_value;
    }
}

function BinOp(left, right, op)
{
    this.op = op;
    this.left = left;
    this.right = right;

    this.eval = function(context) {
        var lv = this.left.eval(context);
        var rv = this.right.eval(context);
        if (this.op == '+')
            return lv + rv;
        else if (this.op == '-')
            return lv - rv;
        else if (this.op == '*')
            return lv * rv;
        else if (this.op == '/')
            return lv / rv;
        throw new Error("unknown binop");
    }
}

function recognize_elem(t)
{
    if (t.type == 'reference') {
        return new Reference(parseFloat(t.value.charCodeAt(0) - 'A'.charCodeAt(0)),
                         parseFloat(t.value2) - 1);
    }
    if (t.type == 'number') {
        return new Value(t.value);
    }
    if (t.type == "range") {
        return new Range(t.value, t.value2);
    }
    throw new Error("unrecognized elem");
}

function parse_expr(tokens, index)
{
    var t = tokens[index];
    if (t.type == 'left_paren') {
        var r = parse_expr(tokens, index + 1);
        if (tokens[r.index].type != 'right_paren')
            throw new Error("unmatched parentheses");
        return {'index': r.index + 1, 'res': r.res};
    } else {
        var left = recognize_elem(t);
        if (index + 1 == tokens.length)
            return {'res': left, 'index': index + 1}
        var next_token = tokens[index + 1];
        if (next_token.type == 'right_paren')
            return {'index': index + 1, 'res': left}
        if (next_token.type != 'binop')
            throw new Error("unrecognized token");
        var op = tokens[index + 1].value;
        var right = parse_expr(tokens, index + 2);
        return {'index': right.index, 'res': new BinOp(left, right.res, op)};
    }
    throw new Error("Error parsing at index " + index);
}

function parse(v)
{
    var tokens = tokenize(v);
    var r = parse_expr(tokens, 0);
    if (r.index != tokens.length)
        throw new Error("wrong stack depth at the end")
    return r.res;
}
