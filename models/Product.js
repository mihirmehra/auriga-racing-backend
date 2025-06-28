const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  currentPrice: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    required: false // Optional, only if discounted
  },
  discountPercentage: {
    type: Number,
    required: false // Optional, only if discounted
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    trackQuantity: {
      type: Boolean,
      default: true
    },
    allowBackorder: {
      type: Boolean,
      default: false
    }
  },
  attributes: [{
    name: String,
    value: String
  }],
  variants: [{
    name: String,
    options: [String],
    price: Number,
    sku: String,
    inventory: Number
  }],
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  brand: {
    type: String,
    required: true
  },
  keyAttributes: {
    size: {
      type: [String],
      default: ['2XL', '2XS', '3XS', 'L', 'M', 'S', 'XL', 'XS'] // Default sizes
    },
    color: {
      type: [String],
      default: ['Gold', 'Orange'] // Default colors
    }
  },
  features: {
    type: [String],
    default: [
      'Aerodynamic Construction',
      'Textured Panels',
      'Ergonomic Fit',
      'Wind Tunnel Testing'
    ]
  }
}, {
  timestamps: true
});

// Create slug from name - Fixed version
productSchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isNew) {
    let baseSlug = this.name
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text

    let slug = baseSlug;
    let counter = 1;

    // Check if slug already exists and make it unique
    while (true) {
      const existingProduct = await mongoose.model('Product').findOne({ 
        slug: slug, 
        _id: { $ne: this._id } 
      });
      
      if (!existingProduct) {
        break;
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }
  next();
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);