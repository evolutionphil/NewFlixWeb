const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Function to generate URL-friendly slug from title
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim() // Remove leading/trailing spaces
        .substring(0, 100); // Limit length to 100 characters
}

let News = new Schema({
    title:{
        type:String
    },
    content:{
        type:String
    },
    slug:{
        type:String,
        unique: true,
        index: true
    },
    created:{
        type:Date,
        default:Date.now
    }
});

// Pre-save middleware to generate slug from title
News.pre('save', function(next) {
    if (this.title && (!this.slug || this.isModified('title'))) {
        let baseSlug = generateSlug(this.title);
        this.slug = baseSlug;
    }
    next();
});

// Virtual to get full URL path
News.virtual('urlPath').get(function() {
    return `/news/${this.slug}`;
});

// Ensure virtual fields are included in JSON output
News.set('toJSON', { virtuals: true });
News.set('toObject', { virtuals: true });

module.exports = mongoose.model('News', News);
