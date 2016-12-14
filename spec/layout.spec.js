var layout = require('../lib/Layout.js')
var fs = require('fs')

var expected_result = fs.readFileSync('spec/data/rendered_back.html', 'utf-8');

describe('Postcard Creator Template Renderer', function() {

    it('Replaces newlines with <br />', function() {
        var data = {
            'recipient': 'somebody',
            'sender'   : 'anybody',
            'message'  : 'foo\nbar\nanother line\n\ndouble'
        }
        expect(layout.getBackPage(data)).toBe(expected_result);
    });

    it('Replaces carriage returns + newlines with <br />', function() {
        var data = {
            'recipient': 'somebody',
            'sender'   : 'anybody',
            'message'  : 'foo\r\nbar\r\nanother line\r\n\r\ndouble'
        }
        expect(layout.getBackPage(data)).toBe(expected_result);
    });
});


