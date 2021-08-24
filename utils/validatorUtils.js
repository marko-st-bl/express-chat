const SQLregex = /('(''|[^'])*')|(\)\;)|(--)|(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|VERSION|ORDER|UNION( +ALL){0,1})/igm;
const XSSregex = /(?:<script(?:\s[^<>]+)*>.*<\/script>)|(?:<.+(?:\s[^<>]+)*(?:\s(?:onload|onfocus|onerror)=(?:"|').+(?:"|'))(?:\s[^<>]+)*\/?>(?:<\/.+>)?)|(?:<.+(?:\s[^<>]+)*(?:\s[^<>]+=(?:"|')javascript:.+(?:"|'))(?:\s[^<>]+)*\/?>(?:<\/.+>)?)/ig;

const detectSQLInjection = (input) => {
    return input.match(SQLregex) ? true : false;
}

const detectXSS = (input) => {
    return input.match(XSSregex) ? true : false;
}

const detectMalicious = (input) => {
    return detectSQLInjection(input) || detectXSS(input);
}

module.exports = {
    detectMalicious
};
