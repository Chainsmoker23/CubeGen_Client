const { awsIcons } = require('@cloud-diagrams/core');

try {
    const keys = Object.keys(awsIcons);
    console.log(`Total AWS Icons: ${keys.length}`);
    if (keys.length > 0) {
        const firstKey = keys[0];
        console.log(`First Key: ${firstKey}`);
        console.log(`First Value Type: ${typeof awsIcons[firstKey]}`);
        console.log(`First Value Preview: ${JSON.stringify(awsIcons[firstKey]).substring(0, 200)}`);
    }
} catch (error) {
    console.error("Error inspecting icons:", error);
}
