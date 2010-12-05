var
  jspack = require('./jspack').jspack,
  sprintf = require('sprintf').sprintf;
  
const HEADER_FORMAT = 'BBHHBB';
const HEADER_LENGTH = 8;

const STATUS = {
  NORMAL: 0x00,
  EOM: 0x01,                      // End Of Message (last packet).
  IGNORE: 0x02,                   // EOM must also be set.
  RESETCONNECTION: 0x08,
  RESETCONNECTIONSKIPTRAN: 0x10
};


const TYPE = {
  PRELOGIN: 0x12,
  LOGIN7: 0x10
};

exports.status = STATUS;
exports.type = TYPE;

const statusAsText = {};
for (var status in STATUS) {
  statusAsText[STATUS[status]] = status;
}

const typesAsText = {};
for (var type in TYPE) {
  typesAsText[TYPE[type]] = type;
}

exports.build = function(type, data, headerFields) {
  data = data || [];
  defaultheaderFields(headerFields);
  
  return header().concat(data);

  function defaultheaderFields() {
    if (!headerFields) {
      headerFields = {};
    }

    if (headerFields.status === undefined) {
      headerFields.status = STATUS.NORMAL;
    }

    if (headerFields.last) {
      headerFields.status |= STATUS.EOM;
    }

    if (headerFields.status & STATUS.IGNORE) {
      headerFields.status |= STATUS.EOM;
    }
    
    headerFields.spid = headerFields.spid || 0;
    headerFields.packet = headerFields.packetId || 0; 
    headerFields.window = headerFields.window || 0; 
  }

  function header() {
    var length = HEADER_LENGTH + data.length
    
    return jspack.Pack(HEADER_FORMAT, [type, headerFields.status, length, headerFields.spid, headerFields.packetId, headerFields.window]);
  }
};

exports.decode = function(packetContent) {
  return {
    header: decodeHeader(),
    data: extractData()
  };
  
  function decodeHeader() {
    var header = jspack.Unpack(HEADER_FORMAT, packetContent, 0);
    
    return {
      type: header[0],
      status: header[1],
      length: header[2],
      spid: header[3],
      packetId: header[4],
      window: header[5]
    };
  }
  
  function extractData() {
    return packetContent.slice(HEADER_LENGTH);
  }
};

exports.toString = function(packetContent) {
  const NL = '\n';
  const packet = exports.decode(packetContent);
  var string = '';

  var statusText = '';
  if (packet.header.status === STATUS.NORMAL) {
    statusText += statusAsText[STATUS.NORMAL];
  } else {
    for (var status in statusAsText) {
      if (packet.header.status & status) {
        statusText += statusAsText[status] + ' ';
      }
    }
    statusText = statusText.trim();
  }
  
//  string += 'Header:' + NL;
//  string += '  type     : ' + typesAsText[packet.header.type] + NL;
//  string += '  status   : ' + sprintf('0x%02X %s', packet.header.status, statusText) + NL;
//  string += '  length   : ' + sprintf('0x%04X', packet.header.length) + NL;
//  string += '  spid     : ' + sprintf('0x%04X', packet.header.spid) + NL;
//  string += '  packetId : ' + sprintf('0x%02X', packet.header.packetId) + NL;
//  string += '  window   : ' + sprintf('0x%02X', packet.header.window) + NL;
//
//  console.log(string);
  
  var headerText = sprintf('header - type:%02X(%s), status:0x%02X(%s), length:0x%04X, spid:0x%04X, packetId:0x%02X, window:0x%02X',
      packet.header.type, typesAsText[packet.header.type],
      packet.header.status, statusText,
      packet.header.length,
      packet.header.spid,
      packet.header.packetId,
      packet.header.window
  );
  
//  console.log('data   - ' + packet.data);
  
  console.log('ffffff');
  
  const BYTES_PER_GROUP = 0x02;
  const BYTES_PER_LINE = 0x04;
  var dataDump = '';
  
  var offset = 0;
  while (offset < packet.data.length) {
    if (offset % BYTES_PER_LINE === 0) {
      dataDump += NL;
      dataDump += sprintf('%04X  ', offset);
    }
    dataDump += sprintf('%02X', packet.data[offset]);
    
    offset++;

    if (offset % BYTES_PER_GROUP === 0) {
      dataDump += ' ';
    }
  }

  dataDump = dataDump.substr(1);
//  console.log(dataDump);
  
  console.log(headerText + NL + dataDump);
  return headerText + NL + dataDump;
}
