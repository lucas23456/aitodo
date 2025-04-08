const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Modify the resolver to mock the DateTimePicker module
config.resolver.extraNodeModules = {
  '@react-native-community/datetimepicker': __dirname + '/shims/DateTimePicker.tsx'
};

module.exports = config; 